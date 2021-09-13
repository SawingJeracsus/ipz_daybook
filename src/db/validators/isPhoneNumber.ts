import {DataBaseValidator} from "../models";

export const isPhoneNumber: DataBaseValidator = (phoneNum) => {
    return  phoneNum.toString().length <= 13
}