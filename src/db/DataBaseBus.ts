import {DataBaseType, Discipline, Homework, Lecture, models, User} from './models'
import mariadb, {PoolConnection} from 'mariadb'
import {log} from "util";

type Partial<T> = {
    [P in keyof T]?: T[P];
};

export class DataBaseBus {
    private isTablesInitialized = false;

    private getConnection () {
        return new Promise<PoolConnection>( async (resolve) => {
            ['DB_USERNAME', 'DB_PASSWORD', 'DB_NAME']
                .forEach(envKey => {
                    if(!envKey){
                        throw new Error(`.env file not full! require ${envKey}`)
                    }
                })

            const pool = mariadb.createPool({
                host: '127.0.0.1',
                user: process.env.DB_USERNAME || 'root',
                port: parseInt(process.env.DB_PORT || '25565', 10),
                password: process.env.DB_PASSWORD
            })
            const conn = await pool.getConnection();
            await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` `)
            await conn.query(`USE \`${process.env.DB_NAME}\` `)

            if(!this.isTablesInitialized){
                this.isTablesInitialized = true
                await this.initTables(conn)
            }

            resolve(conn)
        } )
    }

    private async initTables(conn: PoolConnection){
        await Promise.all(
            Object.keys(models)
                .map(async table => {
                    const fields = models[table];

                    await conn.query(`
                    CREATE TABLE IF NOT EXISTS \`${table}\` (
                        id TINYINT(11) NOT NULL AUTO_INCREMENT,
                        PRIMARY KEY (id),
                        ${
                        Object.values(fields)    
                            .map(field => `${field.name} ${field.sqlType}(${field.length}) ${field.required ? "NOT NULL" : ""}`)
                            .join(', ')
                        }
                        ${
                        Object.values(fields)
                            .filter(field => !!field.reference)
                            .map(field => `, FOREIGN KEY(${field.name}) REFERENCES ${field.reference}(id)`)
                            .join(' ')
                        }
                    )
                `)
                })
        )
    }
    async find
    <Model extends User | Homework | Discipline | Lecture >
    (
        modelName: string,
        parameters: Partial<Omit<Model, 'save' | 'remove'>>,
        select: Array<keyof Omit<Model, 'save' | 'remove'>> = [],
        populate: Array<keyof Omit<Model, 'save' | 'remove'>> = []
    ): Promise<Omit<Model, "save" | "remove">[]>
    {
        const modelTemplate = this.getModel<Model>(modelName)
        if(!modelTemplate){
            return []
        }
        const conn = await this.getConnection();
        const dbres = await conn.query(`
            SELECT
            ${select.length === 0 ? "*" : select.join(', ')}
            FROM ${modelName}
            ${Object.keys(parameters).length === 0 ? "" : "WHERE"}
            ${
                Object.entries(parameters)
                .map( ([key, value]) => `${key}=${typeof value === 'number' ? value : `"${value}"`}` )
                .join(' AND ')
            }
            ORDER BY id
        `)
        return Array.from(dbres)
    }
    async findWithSlq
    <Model extends User | Homework | Discipline | Lecture >
    (
        modelName: string,
        sql: string
    ){
        const conn = await this.getConnection();
        const dbres = await conn.query(sql);
        console.log(dbres);
    }
    getModel<Model extends User | Homework | Discipline | Lecture >(modelName: string, parameters?: Omit<Model, "save" | "remove">){
        if(!models[modelName]){
            return undefined
        }
        const busContext = this
        const config = Object.assign({}, models[modelName])
        if(parameters){
            Object.entries(parameters)
                .forEach(([key, value]) => {
                    if(Object.keys(config).includes(key)){
                        config[key].value = value
                    }
                    if(key === 'id'){
                        config.id = {
                            name: "id",
                            jsType: Number,
                            sqlType: "int NOT NULL AUTO_INCREMENT",
                            required: true,
                            value: value,
                            length: 11
                        }
                    }
                })
        }
        const model = {
            config,
            async save(){
                if(!!Object.values(this.config).find(field => !field.value && field.required)){
                    throw new Error('Required fields should have some value')
                }

                const conn = await busContext.getConnection()
                if(this.config.id){
                    await conn.query(`
                        UPDATE ${modelName}
                        SET ${
                            Object.entries(this.config)
                            .filter( ([key, _]) => key !== "id" )
                            .map( ([_, value]) => `${value.name}=${typeof value.value === "number" ? value.value : `"${value?.value?.replace(/"/g, '\\"')}"` || ""}` )
                            .join(', ')
                        }
                        WHERE id = ${this.config.id.value}
                    `)
                    return
                }
                const dbResponse = await conn.query(`
                            INSERT INTO ${modelName} 
                            (${Object.values(this.config).map(field => field.name).join(', ')})
                            VALUES (
                                ${Object.values(this.config)
                    .map(field => {
                        if(field.jsType === Number){
                            return field.value.toString()
                        }else{
                            return `"${field?.value?.replace ? field?.value?.replace(/"/g, '\\"') : ""}"`
                        }
                    })
                    .join(', ')}
                            );
                        `)
                this.config.id = {
                    name: "id",
                    jsType: Number,
                    sqlType: "int NOT NULL AUTO_INCREMENT",
                    required: true,
                    value: dbResponse.insertId,
                    length: 11
                }
            },
            async remove(){
                if(this.config.id){
                    const conn = await busContext.getConnection();
                    await conn.query(`
                        DELETE FROM ${modelName}
                        WHERE
                        id = ${this.config.id.value}
                    `)
                }
            }
        } as {config: { [p: string]: DataBaseType }, save: () => Promise<void>, remove: () => Promise<void>};
        // @ts-ignore
        return new Proxy(model, {
            set(target, prop, value): boolean {
                if(prop === "id"){
                    target.config.id = {
                        name: "id",
                        jsType: Number,
                        sqlType: "int NOT NULL AUTO_INCREMENT",
                        required: true,
                        value: value,
                        length: 11
                    }
                    return true
                }

                if(typeof prop !== 'string' || !Object.keys(target.config).includes(prop)){
                    return false
                }

                let validatorsResult = true
                if(target.config[prop]?.validators){
                    // @ts-ignore
                    for (let validator of target.config[prop]?.validators ){
                        if(!validator(value)){
                            console.error('value not path validators')
                            validatorsResult = false
                        }
                    }
                }

                if( value.toString().length > target.config[prop].length){
                    console.error('value not path length validation, value too big')
                    return false
                }

                if(validatorsResult){
                    target.config[prop].value = value
                }

                return true && validatorsResult
            },
            get(target, prop){
                if(typeof prop !== 'string'){
                    return undefined
                }
                if (["save", "config", "remove"].includes(prop)){
                    return target[prop as "save"];
                }
                if(Object.keys(target.config).includes(prop)){
                    return target.config[prop]?.value
                }
                return undefined;
            }
        }) as Model;
    }
}
