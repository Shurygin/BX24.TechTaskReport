 
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
}); 
let clickEvent = new Event("click");
let blurEvent = new Event("blur");
let dblclickEvent = new Event("dblclick");
let focusEvent = new Event("focus");
let changeEvent = new Event("change");
let selectEvent = new Event("select");
let keyupEvent = new Event("keyup");
let filterBeginTime,filterEndTime,filterMinTime,filterMaxTime;
let workType=['тарировка бака','калибровка тахографа'];
let taskID=[],tasks=[],works=[],crm=[],carsID=[],companyesID=[],cars=[],companyes=[],subTasks=[],mods=[];
let cost=0,carsQuantity=0,rowNumber=1,price=0,days=0,subCloseTime=0,mainCloseTime=0,modValue=1;
let company,car,carNumber='',carModel='',companyTitle='',row='',mark='';
let modCheck=false;
function Car(id,model,number){
    this.id=id;
    this.model=model;
    this.number=number;
}
function Company(id,title){
    this.id=id;
    this.title=title;
}
$(document).ready(function(){
    let l,k,i,count=0;
    let employes=[];      
    let local = new Date();
    let past = new Date(2592000000);
    let pastTime = new Date(local-past);
    $('#filterEndTime').attr( "value", `${local.toDateInputValue()}T23:59`);
    $('#filterBeginTime').attr( "value", `${pastTime.toDateInputValue()}T00:00`); 
    BX24.callMethod('user.get', {"ACTIVE": true}, function(result){
         for (i =0;i<50;i++){             
             if(result.answer.result[i]!=undefined){
                 if (result.answer.result[i].LAST_NAME!=""&&result.answer.result[i].LAST_NAME!=null&&result.answer.result[i].ACTIVE==true){
                    employes.push(result.data()[i].LAST_NAME);                                   
                }
             }                
         } 
         if (result.more()){               
             result.next();
         } else {
             for (i =0;i<50;i++){                 
                 if(result.answer.result[i]!=undefined){
                     if (result.answer.result[i].LAST_NAME!=""&&result.answer.result[i].LAST_NAME!=null&&result.answer.result[i]!=undefined){                       
                        employes.push(result.data()[i].LAST_NAME);
                        employes.sort();
                        elemForDispatch.dispatchEvent(clickEvent);
                     }
                 }         
            }              
         }  
     });
    /*генерация списка сотрудников one стоит, чтобы не выполнялась лишний раз*/
    $('#elemForDispatch').one('click',function(){                        
        l = employes.length;
        for (k=0;k<l;k++){
            $('#filterUsersList').append(`<option value = "${employes[k]}">${employes[k]}</option>`);        
        } 
    });
    /*действия при клике, обнуление данных, перестроение таблицы, получение данных для фильтра, получение ИД пользователя*/
    $('#filterButton').click(function(){
        
        $('body').css('cursor','wait');
        $('#filterButton').attr('disabled','disabled');
        $('.mainTableHeader').html("Отчёт строится...");
        taskID=[],tasks=[],works=[],crm=[],carsID=[],companyesID=[],cars=[],companyes=[],subTasks=[],mods=[];
        cost=0,carsQuantity=0,rowNumber=1,price=0,days=0,subCloseTime=0,mainCloseTime=0,modValue=1;
        company,car,carNumber='',carModel='',companyTitle='',row='',mark='';
        $('.mainTableHeader').next().html('<table id="mainTable"  width="100%" class="mainTable table table-bordered table-hover filterTable"><tr id="tableHead" class="tableHead labelRow success"><td class="tableNumber">№</td><td id="tableTaskName">Компания</td><td id="tableDeadline">Модель машины</td><td id="tableDeadline">Гос. номер</td><td id="tableClosedDate">Тип работы</td><td id="tableClosedDate">Дата выполнения задачи</td><td id="tableClosedDate">Дней для сдачи акта</td><td>Оценка</td><td>Стоимость</td></tr> </table>'); 
       filterBeginTime= new Date($('#filterBeginTime').val());
       filterEndTime= new Date($('#filterEndTime').val());
      
    /*Проверка валидности даты*/
       if (filterEndTime<filterBeginTime|| filterBeginTime== "Invalid Date"||filterEndTime== "Invalid Date"){
            alert("Введите корректное время");
        } 
    /*Получение ИД выбранного пользователя*/
        BX24.callMethod('user.get', {"LAST_NAME": `${$('#filterUsersList').val()}`}, function(result){
            filteredUser=result.data()[0].ID;            
            elemForDispatch.dispatchEvent(blurEvent);
        });
    }); 
    /*поиск звонков по фильтру и разбитие их в массивы, поиск лидов, контактов и компаний*/
    $('#elemForDispatch').blur(function(){      
       BX24.callMethod('task.item.list',[
            {ID : 'desc'},		
            {RESPONSIBLE_ID:filteredUser,">=CLOSED_DATE":filterBeginTime,"<=CLOSED_DATE":filterEndTime},	
            {LOAD_TAGS:'Y'},
            ['UF_*','TAGS','ID','CLOSED_DATE','MARK','TITLE']
	   ],function(result){
		  result.data().forEach(function(task, i){
              
                 tasks.push(task);
                taskID.push(task.ID);
                            
            });
           if (result.more()){               
                result.next();
           } else {
               elemForDispatch.dispatchEvent(dblclickEvent);
           }
	   });
    }); 
    
    $('#elemForDispatch').dblclick(function(){        
       /* taskID.forEach(function(id,i){            
            setTimeout(function(){
                BX24.callMethod('task.item.getdata',[id],function(result){
		          tasks.push(result.data());		          
                });
            },i*i);                       
            if(i==(taskID.length-1)){
                setTimeout(function(){
                    elemForDispatch.dispatchEvent(focusEvent);
                },i*i+i*10);                
            }
        });*/
        BX24.callMethod('task.item.list',[
            {ID : 'desc'},		
            {PARENT_ID:taskID},	
            {},
            {}
	       ],function(result){
            result.data().forEach(function(task, i){              
                 subTasks.push(task);
            });
           if (result.more()){               
                result.next();
           } 
	       });
    });
    $('#elemForDispatch').focus(function(){
        
        setTimeout(function(){
            $('#filterButton').removeAttr('disabled');
        },tasks.length*200);
        tasks.forEach(function(task,i){            
            crm=task.UF_CRM_TASK;            
            crm.forEach(function(crmEl,k){                
                if (crmEl.substr(0,2)=="C_"){
                    carsID.push(crmEl.substr(2,(crmEl.length-2)));
                } else if(crmEl.substr(0,2)=="CO"){
                    companyesID.push(crmEl.substr(3,(crmEl.length-3)));
                } else{
                    console.log("whatever");
                }               
                if (k==(crm.length-1)&&i==(tasks.length-1)){
                    setTimeout(function(){
                        elemForDispatch.dispatchEvent(changeEvent); 
                    },50);                    
                } 
            });
        });
    });
    
    $('#elemForDispatch').change(function(){       
        BX24.callMethod(
			"crm.contact.list", 
			{ 
				order: { "DATE_CREATE": "ASC" },
				filter: { "TYPE_ID": "1", ID: carsID },
				select: [ "ID", "NAME", "LAST_NAME" ]
			}, 
			function(result) 
			{
				if(result.error())
					console.error(result.error());
				else
				{
					result.data().forEach(function(car,i){
                        car = new Car(car.ID,car.NAME,car.LAST_NAME);
                        cars.push(car);
                    });		
					if(result.more()){
                        console.log(cars);
                        result.next();	
                    } 										
				}
			}
		);
        
        BX24.callMethod(
			"crm.company.list", 
			{ 
				filter: { ID: companyesID },
				select: [ "ID", "TITLE" ]
			}, 
			function(result) 
			{
				if(result.error())
					console.error(result.error());
				else
				{
					result.data().forEach(function(company,i){
                        company = new Company(company.ID,company.TITLE);
                        companyes.push(company);
                    });		
					if(result.more()){
                        result.next();	
                    } else{                        
                        elemForDispatch.dispatchEvent(selectEvent);
                    }						
				}
			}
		);
    });
    $('#elemForDispatch').select(function(){
        
        tasks.forEach(function(task,t){
            
            modValue=1;
            modCheck=false;
            subTasks.forEach(function(subTask,st){
                
                if (task.ID==subTask.PARENT_ID){
                    console.log(task.subTask.PARENT_ID);
                    
                    if (subTask.CLOSED_DATE!=null){
                        subCloseTime = new Date(subTask.CLOSED_DATE);
                        mainCloseTime = new Date(task.CLOSED_DATE);
                        subCloseTime=subCloseTime.getTime();
                        mainCloseTime=mainCloseTime.getTime();
                        days=Math.floor((subCloseTime-mainCloseTime)/24/60/60/1000);
                    } else {
                        days='Акты не сдал';
                    }
                    if (task.MARK=="P"){
                        mark='Положительная';
                    } else if (task.MARK=="N"){
                        mark='Отрицательная';
                    } else {
                        mark='Без оценки';
                    }
                   crm=task.UF_CRM_TASK; 
                   crm.forEach(function(crmElem,e){
                if(crmElem.substr(0,2)=="CO"){
                    companyes.forEach(function(company,g){
                        if(crmElem.substr(3,(crmElem.length-3))==company.id){
                            companyTitle=company.title;
                            crm.forEach(function(crmEl,ce){
                                if(crmEl.substr(0,2)=="C_"){
                    cars.forEach(function(car,c){
                        if(crmEl.substr(2,(crmEl.length-2))==car.id){
                            mods=task.TAGS;
                            if (mods.length>0){
                                mods.forEach(function(mod,m){
                                switch(mod){
                                    case 'Командировка':
                                        modValue+=0.5;
                                        break;
                                    default: 
                                        break;
                                }
                                 
                                
                            });
                               
                                
                                    
                                works=task.TITLE.split(', ');                               
                                works.forEach(function(work,w){
                                work=work.toLowerCase();
                                switch(work){
                                    case 'тарировка бака':
                                        price=500*modValue;
                                        cost+=price;                                        
                                        row=`<tr class="${task.MARK}"><td>${rowNumber}</td><td>${companyTitle}</td><td>${car.model}</td><td>${car.number}</td><td>${work}</td><td>${task.CLOSED_DATE}</td><td>${days}</td><td>${mark}</td><td>${price}</td></tr>`;
                                        rowNumber++;
                                        $('#mainTable').children().children().last().after(row); 
                                        break;
                                    case 'калибровка тахографа':
                                        price=200*modValue;
                                        cost+=price;                                        
                                        row=`<tr class="${task.MARK}"><td>${rowNumber}</td><td>${companyTitle}</td><td>${car.model}</td><td>${car.number}</td><td>${work}</td><td>${task.CLOSED_DATE}</td><td>${days}</td><td>${mark}</td><td>${price}</td></tr>`;
                                        rowNumber++;
                                        $('#mainTable').children().children().last().after(row);
                                        break;
                                    default:
                                        break;
                                } 
                                });
                                    
                                
                                
                                
                            } else {
                                works=task.TITLE.split(', ');                                
                                works.forEach(function(work,w){
                                work=work.toLowerCase();
                                switch(work){
                                    case 'тарировка бака':
                                        price=500*modValue;
                                        cost+=price;                                        
                                        row=`<tr class="${task.MARK}"><td>${rowNumber}</td><td>${companyTitle}</td><td>${car.model}</td><td>${car.number}</td><td>${work}</td><td>${task.CLOSED_DATE}</td><td>${days}</td><td>${mark}</td><td>${price}</td></tr>`;
                                        rowNumber++;
                                        $('#mainTable').children().children().last().after(row); 
                                        break;
                                    case 'калибровка тахографа':
                                        price=200*modValue;
                                        cost+=price;                                        
                                        row=`<tr class="${task.MARK}"><td>${rowNumber}</td><td>${companyTitle}</td><td>${car.model}</td><td>${car.number}</td><td>${work}</td><td>${task.CLOSED_DATE}</td><td>${days}</td><td>${mark}</td><td>${price}</td></tr>`;
                                        rowNumber++;
                                        $('#mainTable').children().children().last().after(row);
                                        break;
                                    default:
                                        break;
                                } 
                            }); 
                            }
                            
                            
                                                       
                        }
                    });
                }
                            });
                        }
                    }); 
                }
                
            }); 
                }
            });
                             
            
            if(t==(tasks.length-1)) {
                setTimeout(function(){
                    $('body').css('cursor','default');        
                    $('.mainTableHeader').html("Отчёт");
                    row=`<tr><td>${rowNumber}</td><td><b>ИТОГО</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td>${(Number(cost)+Number($('#oklad').val()))}</td></tr>`; 
                    $('#mainTable').children().children().last().after(row);
                },t);
            } 
        });                
    });   
}); 

