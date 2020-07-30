const regression = require("regression");
const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
var gas_data;
var date_empty;
const User = require("../Modals/user");
var user_table = User.find({"gasId":{$ne:null}},{gas_conc:1,gasId:1});

Date.prototype.addDays = function(days){
    var date = new Date();
    date.setDate(date.getDate()+days);
    var d=date.toDateString();
    return d;
}
user_table.exec(function(err,data){
    if(err) throw err;
    gas_data=data;
    console.log(gas_data)
    gas_data.forEach(function(data){
        var dataset=[];
        gas=data.gas_conc;
        var count=0;
        for(i=0;i<gas.length;i++){
            var d=[i+1,Number(gas[i])];
            dataset.push(d);
            count++;
        }
        const result = regression.linear(dataset);
        const gradient = result.equation[0];
        const yIntercept = result.equation[1];
        var gas_empty = Math.round(-(yIntercept)/gradient);
        console.log(gradient);
        console.log(yIntercept);
        console.log("gas empty in "+(gas_empty-count));
        var date = new Date();
        date_empty=date.addDays((gas_empty-count));
        console.log(date_empty);
        console.log(data.gasId)
        User.findOneAndUpdate({gasId:data.gasId},{$set:{gas_empty_date:date_empty}},function(err){
            if(err)throw err; 
        }) 
    })  
}) 
