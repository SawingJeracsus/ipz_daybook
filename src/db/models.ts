import {isEmail} from "./validators/isEmail";
import {isPhoneNumber} from "./validators/isPhoneNumber";

export type DataBaseValidator = ( value: any ) => boolean

export interface DataBaseType {
    name: string;
    length: number;

    sqlType: string;
    jsType: any;
    required: boolean;
    validators?: DataBaseValidator[];
    reference?: string,
    value?: any
}
interface Model{
    save: () => Promise<void>;
    remove: () => Promise<void>;
    id?: number
}
export interface User extends Model{
    telegram_id: string,
    username: string,
    email: string,
    phone_number: string,
}

export interface Homework extends Model{
    task: string,
    author: number,
    discipline: number,
    description: string,
    deadline: string
}

export interface Discipline extends Model{
    lecture: number,
    name: string
}

export interface Lecture extends Model{
    name: string,
    email: string,
    phone_number: string
}

export const models: {
    [key: string]: {
        [key: string]: DataBaseType
    }
}
= {
    user: {
        telegram_id: {
            name: 'telegram_id',
            length: 11,
            sqlType: "VARCHAR",
            jsType: String,
            required: true
        },
        username: {
            name: 'username',
            length: 50,
            sqlType: "VARCHAR",
            jsType: String,
            required: true
        },
        email: {
            name: 'email',
            length: 50,
            sqlType: "VARCHAR",
            jsType: String,
            required: false,
            validators: [
                isEmail
            ]
        },
        phone_number: {
            name: 'phone_number',
            length: 13,
            sqlType: "VARCHAR",
            jsType: String,
            required: false,
            validators: [
                isPhoneNumber
            ]
        }
    },
    lecture: {
        name: {
            name: 'name',
            length: 50,
            sqlType: "VARCHAR",
            jsType: String,
            required: true
        },
        email: {
            name: 'email',
            length: 50,
            sqlType: "VARCHAR",
            jsType: String,
            required: true,
            validators: [
                isEmail
            ]
        },
        phone_number: {
            name: 'phone_number',
            length: 13,
            sqlType: "VARCHAR",
            jsType: String,
            required: true,
            validators: [
                isPhoneNumber
            ]
        },
    },
    discipline: {
        name: {
            name: 'name',
            length: 50,
            sqlType: "VARCHAR",
            jsType: String,
            required: true
        },
        lecture:{
            name: 'lecture',
            length: 11,
            sqlType: "TINYINT",
            jsType: Number,
            required: true,
            reference: "lecture"
        }
    },
    homework: {
        task: {
            name: 'task',
            length: 500,
            sqlType: "TEXT",
            jsType: String,
            required: true
        },
        author: {
            name: 'author',
            length: 11,
            sqlType: "TINYINT",
            jsType: Number,
            required: true,
            reference: "user"
        },
        discipline: {
            name: 'discipline',
            length: 11,
            sqlType: "TINYINT",
            jsType: Number,
            required: true,
            reference: "discipline"
        },
        description: {
            name: 'description',
            length: 500,
            sqlType: "TEXT",
            jsType: String,
            required: true
        },
        deadline: {
            name: 'deadline',
            length: 128,
            sqlType: "VARCHAR",
            jsType: String,
            required: true
        }
    },

}