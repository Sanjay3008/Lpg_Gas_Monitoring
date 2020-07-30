const mongoose = require("mongoose");
var date = new Date();
const distributerschema = new mongoose.Schema({

    name: {
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        }
    },
    address: {type:String,required:true},
    country:{type:String,required:true},
    state:{type:String,required:true},
    city:{type:String,required:true},
    phoneno: {type:String,required:true},
    email: {type:String,required:true},
    password: {type:String,required:true},
    date:{type:String,default:date.toDateString()}
})

const Distributer = mongoose.model("Distributer",distributerschema);
module.exports=Distributer;
