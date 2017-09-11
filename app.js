 
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
let taskID=[],tasks=[],works=[],crm=[],carsID=[],companyesID=[],cars=[],companyes=[],subTasks=[],mods=[],rows=[],request={},workDetails={};
let cost=0,carsQuantity=0,rowNumber=1,price=0,days=0,subCloseTime=0,mainCloseTime=0,modValue=1, t=0;
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
function WorkDetails(i){
    this.i=i;
}
let Row={};
$(document).ready(function(){
    let l,k,i,count=0;
    let employes=[];      
    let local = new Date();
    let year = local.getFullYear();
    let month = local.getMonth();
    let pastTime = new Date(year,month,1);
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
    /*генерация списка сотрудников, one стоит, чтобы не выполнялась лишний раз*/
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
        let ostatok=taskID.length%50;
        let n=1;
        let currentReq={};
        let j=0;
        let p=0;
        t=Math.floor(taskID.length/50);
        taskID.forEach(function(id,i){            
            request[i]=['task.checklistitem.getlist',[id,{'TOGGLED_DATE': 'desc'}]];
            if (i==(taskID.length-1)){                
                if (i<=50){
                    setTimeout(function(){
                        BX24.callBatch(request, function(result){ 
                            for (j=0;j<i;j++){
                                if (result[j].data().length>0){
                                    result[j].data().forEach(function(work,g){                                        
                                        works.push(work);                                        
                                    });
                                }
                                if (j==(i-1)){
                                    setTimeout(function(){                                        
                                        elemForDispatch.dispatchEvent(focusEvent);
                                    },50);
                                }
                            }
                        });
                    },50);  
                } else {                     
                    for (var l=0;l<=t;l++){
                        if (l!=t){                      
                            currentReq={};
                            for (j=0;j<50;j++){
                              n=50*l+j; 
                              currentReq[j]=request[n];                              
                              if (j==49){                                  
                                    BX24.callBatch(currentReq, function(result){  
                                        for (p=0;p<j;p++){
                                                if (result[p].data().length>0){
                                                    result[p].data().forEach(function(work,g){
                                                        works.push(work);
                                                    });
                                                }
                                            }
                                    });
                              }
                            } 
                                                       
                        } else {                            
                            setTimeout(function(){                            
                            currentReq={};
                            for (j=0;j<=ostatok;j++){
                                n=50*t+ostatok-j;                                
                                currentReq[j]=request[n];
                                if (j==ostatok){
                                        BX24.callBatch(currentReq, function(result){                                                                                        
                                            for (p=0;p<j;p++){                                                                                               
                                                if (result[p]!=undefined){
                                                   if (result[p].data().length>0){
                                                    result[p].data().forEach(function(work,g){
                                                        works.push(work);                                                        
                                                    });
                                                   } 
                                                }                                                
                                                if (p==(j-1)){
                                                    setTimeout(function(){                                                                                                            
                                                        elemForDispatch.dispatchEvent(focusEvent);
                                                    },50);
                                                }
                                            }
                                        });
                                }
                            }
                            },l*500);
                        }
                    }
                }
                              
            }
        });
        
        
        
       /* запрос подзадач
       
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
	       });*/
    });
    $('#elemForDispatch').focus(function(){
        
       /*setTimeout(function(){
            $('#filterButton').removeAttr('disabled');
        },tasks.length*200);*/        
        tasks.forEach(function(task,i){            
            crm=task.UF_CRM_TASK; 
            if (i==(tasks.length-1)&&crm.length==0){
               setTimeout(function(){
                    
                    elemForDispatch.dispatchEvent(changeEvent); 
                },50);                        
            }
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
        works.forEach(function(work,w){
            if (work.TOGGLED_DATE!=null&&work.TITLE!="Сдать акты"){
                workDetails[w] = new WorkDetails(w);
                workDetails[w].TITLE=work.TITLE;
                workDetails[w].closed=true;                
                workDetails[w].COMPLETE_DATE=work.TOGGLED_DATE;
                works.forEach(function(actWork,aw){                    
                    if (actWork.TITLE=="Сдать акты"&&actWork.TASK_ID==work.TASK_ID){                       
                        if (actWork.TOGGLED_DATE!=null){
                            subCloseTime = new Date(actWork.TOGGLED_DATE);
                            mainCloseTime = new Date(work.TOGGLED_DATE);                            
                            subCloseTime=subCloseTime.getTime();
                            mainCloseTime=mainCloseTime.getTime();
                            workDetails[w].days=Math.floor((subCloseTime-mainCloseTime)/24/60/60/1000);                            
                        } else {                           
                            workDetails[w].days='Акты не сдал';
                        }
                    }
                });
                tasks.forEach(function(task,t){
                    if (task.ID==work.TASK_ID){
                        workDetails[w].cars=[];
                        if (task.MARK=="P"){
                            workDetails[w].mark='Положительная';
                        } else if (task.MARK=="N"){
                            workDetails[w].mark='Отрицательная';
                        } else {
                            workDetails[w].mark='Без оценки';
                        }
                        workDetails[w].modValue=1;
                        crm=task.UF_CRM_TASK; 
                        crm.forEach(function(crmElem,e){
                            if(crmElem.substr(0,2)=="CO"){                            
                                companyes.forEach(function(company,co){                                    
                                    if(crmElem.substr(3,(crmElem.length-3))==company.id){
                                        workDetails[w].COMPANY_TITLE=company.title;  
                                    }
                                });
                            }
                        });
                        workDetails[w].mods=task.TAGS;
                        if (workDetails[w].mods.length>0){
                            workDetails[w].mods.forEach(function(mod,m){
                                switch(mod){
                                    case 'Командировка':
                                        workDetails[w].modValue+=0.5;
                                        break;
                                    default: 
                                        break;
                                }
                            }); 
                        }
                        switch(workDetails[w].TITLE){
                            case 'Тарировка бака':
                                workDetails[w].price=500*workDetails[w].modValue;
                                workDetails[w].valid=true;
                                break;
                            case 'Калибровка тахографа':
                                workDetails[w].price=200*workDetails[w].modValue;
                                workDetails[w].valid=true;
                                break;
                            default:
                                workDetails[w].valid=false;
                                break;
                        }
                        crm.forEach(function(crmEl,ca){
                            if(crmEl.substr(0,2)=="C_"){
                                cars.forEach(function(car,c){
                                    if (crmEl.substr(2,(crmEl.length-2))==car.id){
                                        workDetails[w].cars.push(car);
                                    }
                                }); 
                            }
                        }); 
                    }
                });
            }
            if(w==(works.length-1)){
                elemForDispatch.dispatchEvent(keyupEvent);
            }
        });               
    }); 
    $('#elemForDispatch').keyup(function(){
        console.log(workDetails);
        for (i=0;i<=works.length;i++){
            if (workDetails[i]!=undefined&&workDetails[i].valid==true&&workDetails[i].closed==true){
                 workDetails[i].cars.forEach(function(car,c){                     
                     if (isNaN(workDetails[i].days)||workDetails[i].days==undefined){
                         cost+=workDetails[i].price;
                         row=`<tr class="${workDetails[i].mark}"><td>${rowNumber}</td><td>${workDetails[i].COMPANY_TITLE}</td><td>${car.model}</td><td>${car.number}</td><td>${workDetails[i].TITLE}</td><td>${workDetails[i].COMPLETE_DATE}</td><td>Нет задачи для актов</td><td>${workDetails[i].mark}</td><td>${workDetails[i].price}</td></tr>`;
                         rowNumber++;
                         $('#mainTable').children().children().last().after(row); 
                     } else {
                         cost+=workDetails[i].price;
                         row=`<tr class="${workDetails[i].mark}"><td>${rowNumber}</td><td>${workDetails[i].COMPANY_TITLE}</td><td>${car.model}</td><td>${car.number}</td><td>${workDetails[i].TITLE}</td><td>${workDetails[i].COMPLETE_DATE}</td><td>${workDetails[i].days}</td><td>${workDetails[i].mark}</td><td>${workDetails[i].price}</td></tr>`;
                         rowNumber++;
                         $('#mainTable').children().children().last().after(row); 
                     }
                 });
            }
            if (i==works.length){
                setTimeout(function(){
                    $('#filterButton').removeAttr('disabled');
                    $('body').css('cursor','default');        
                    $('.mainTableHeader').html("Отчёт");
                    row=`<tr><td>${rowNumber}</td><td><b>ИТОГО</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td>${(Number(cost)+Number($('#oklad').val()))}</td></tr>`; 
                    $('#mainTable').children().children().last().after(row);
                },50);
            }
        }
    });
}); 

