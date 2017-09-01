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
let unknownCalls=[],contactCalls=[],contactList=[],companyList=[],companyCalls=[],contactsID=[],companyesID=[],leadCalls=[],leadID=[],leadList=[],crmCalls=[],crmID=[],crmList=[];
let nullCount=0,rowNumber=1,subRowNumber=1,companyNumber=0,filteredUser=0,leadCallTime=0;
let row="",callTime="";
let filterBeginTime,filterEndTime,filterMinTime,filterMaxTime;
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
        nullCount=0,rowNumber=1,subRowNumber=1,companyNumber=0,filteredUser=0,leadCallTime=0;
        unknownCalls=[],contactCalls=[],contactList=[],companyList=[],companyCalls=[],contactsID=[],companyesID=[],leadCalls=[],leadID=[],leadList=[],crmCalls=[],crmID=[],crmList=[];
        $('.mainTableHeader').next().html('<table id="mainTable"  width="100%" class="mainTable table table-bordered table-hover filterTable"><tr id="tableHead" class="tableHead labelRow success"><td class="tableNumber">№</td><td id="tableTaskName">Компания</td><td id="tableDeadline">Количество звонков</td><td id="tableDeadline">Контакт</td><td id="tableClosedDate">Дата начала разговора</td><td id="tableClosedDate">Продолжительность звонка</td><td id="tableClosedDate">Тип звонка</td><td>Ссылки на файлы</td></tr> </table>'); 
       filterBeginTime= new Date($('#filterBeginTime').val());
       filterEndTime= new Date($('#filterEndTime').val());
       filterMinTime=$('#filterMinTime').val();
       filterMaxTime=$('#filterMaxTime').val();
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
        BX24.callMethod('voximplant.statistic.get',
            {
            "FILTER": {">CALL_DURATION":filterMinTime,"<CALL_DURATION":filterMaxTime,"PORTAL_USER_ID":filteredUser,">CALL_START_DATE":filterBeginTime,"<CALL_START_DATE":filterEndTime
                    }
            },function(result){
            if(result.error()) {
                console.error(result.error());
            }else {                        
                for (i=0;i<50;i++){
                    if(result.data()[i]!=undefined){                                
                        if (result.data()[i].CRM_ENTITY_TYPE=="CONTACT"){
                            contactCalls.push(result.data()[i]);
                        } else if(result.data()[i].CRM_ENTITY_TYPE=="LEAD"){
                            leadCalls.push(result.data()[i]);
                            leadCallTime=Number(leadCallTime)+Number(result.data()[i].CALL_DURATION);
                        } else if(result.data()[i].CRM_ENTITY_TYPE=="COMPANY"){
                            crmCalls.push(result.data()[i]);
                        } else{
                            console.log(result.data()[i]);
                            nullCount++;
                            unknownCalls.push(result.data()[i]);                                    
                        }  
                    }                                                    
                }                        
                if (result.more()){               
                    result.next();
                } else {
                    callTime=(Math.floor(leadCallTime / 60)) + ':' + (leadCallTime % 60);
                    elemForDispatch.dispatchEvent(selectEvent);                
                    row=`<tr class="${companyNumber}"><td>${rowNumber}</td><td class="detailsForCalls">Лиды</td><td>${(leadCalls.length+nullCount)}</td><td></td><td></td><td>${callTime}</td></tr>`;                
                    $('#mainTable').children().children().last().after(row);
                    rowNumber++;
                    companyNumber++; 
                }
            }                        
        });
            
    }); 
    /*Поиск компаний и контактов*/
    
     $('#elemForDispatch').select(function(){
         if (crmCalls.length>0){
             crmCalls.forEach(function(call,i){
                 crmID.push(call.CRM_ENTITY_ID);
                 if (i==(crmCalls.length-1)){
                     setTimeout(function(){
                        BX24.callMethod("crm.company.list", { filter:{ID:crmID},select: [ "ID", "TITLE" ]	},function(result){
				            if(result.error()){
                                console.error(result.error());
                            } else {                    
					            result.data().forEach(function(company,i){
                                    crmList.push(company);
                                });			
                                if(result.more()&&companyList.length%100==0){
                                    setTimeout(function(){
                                        console.log("Companyes: "+companyList.length);
                                        result.next(); 
                                    },500);
                                } else if(result.more()) {
                                    result.next();
                                } else{
                                    console.log("companyes found");
                                    
                                    elemForDispatch.dispatchEvent(keyupEvent);
                                }
				            }
			             }
		              );
                    },50);
                 }
             });
         } else {
             
             elemForDispatch.dispatchEvent(dblclickEvent);
         }
     });
    
    $('#elemForDispatch').keyup(function(){
        crmCalls.forEach(function(call,i){
            crmList.forEach(function(company,j){
               // console.log(call);
              //  console.log(company);
                if(call.CRM_ENTITY_ID==company.ID){
                    callTime=(Math.floor(call.CALL_DURATION / 60)) + ':' + (call.CALL_DURATION % 60);
                                        if (call.CALL_TYPE==1){
                                            row=`<tr><td>${rowNumber}</td><td>${company.TITLE}</td><td>1</td><td>Не закреплен</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Исходящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                                        } else{
                                            row=`<tr><td>${rowNumber}</td><td>${company.TITLE}</td><td>1</td><td>Не закреплен<</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Входящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                                        } 
                                        $('#mainTable').children().children().last().after(row);
                                        rowNumber++;
                                        
                }    
                                        
                if (j==(crmList.length-1)&&i==(crmCalls.length-1)){
                        
                        elemForDispatch.dispatchEvent(dblclickEvent);
                }
            });
        });
    });
    
    $('#elemForDispatch').dblclick(function(){
        if (contactCalls.length>0){
            contactCalls.forEach(function(call,i){
                contactsID.push(call.CRM_ENTITY_ID);
                if (i==(contactCalls.length-1)){
                    setTimeout(function(){
                       BX24.callMethod("crm.contact.list",{filter:{ID:contactsID},select: [ "ID",  "LAST_NAME","COMPANY_ID","PHONE" ]},function(result){
                        if(result.error()){
                            console.error(result.error()); 
                        }else{
                            result.data().forEach(function(contact,i){
                                contactList.push(contact);
                            });	
                            if(result.more()&&contactList.length%2000==0){
                                setTimeout(function(){
                                    console.log("Contacts: "+contactList.length);
                                    result.next(); 
                                },1000);
                            } else if(result.more()){
                                result.next();
                            } else{
                                
                                console.log("contacts found"); 
                                elemForDispatch.dispatchEvent(changeEvent);
                            }																
                        }
                        }); 
                    },50);
                }
            });
        }
          
    });
    $('#elemForDispatch').change(function(){
        if(contactList.length>0){
            contactList.forEach(function(contact,i){
                if (contact.COMPANY_ID!=null){
                    companyesID.push(contact.COMPANY_ID);
                }
                if (i==(contactList.length-1)){
                    setTimeout(function(){
                        BX24.callMethod("crm.company.list", { filter:{ID:companyesID},select: [ "ID", "TITLE" ]	},function(result){
				            if(result.error()){
                                console.error(result.error());
                            } else {                    
					            result.data().forEach(function(company,i){
                                    companyList.push(company);
                                });			
                                if(result.more()&&companyList.length%100==0){
                                    setTimeout(function(){
                                        console.log("Companyes: "+companyList.length);
                                        result.next(); 
                                    },500);
                                } else if(result.more()) {
                                    result.next();
                                } else{
                                    console.log("companyes found");
                                    elemForDispatch.dispatchEvent(focusEvent);
                                }
				            }
			             }
		              );
                    },50);
                }
            });
        }
        
    });    
    
    
    $('#elemForDispatch').focus(function(){  
        if (contactCalls.length>0){
            
            contactCalls.forEach(function(call,i){
               
                if (i==(contactCalls.length-1)){
                    console.log(leadCalls.length);
                    console.log(rowNumber);
                    $('body').css('cursor','default');
                    $('#filterButton').removeAttr('disabled');
                    $('.mainTableHeader').html("Отчёт");
                    row=`<tr><td></td><td><b>Количество звонков</b></td><td>${(leadCalls.length+rowNumber-1+nullCount)}</td></tr>`;
                    $('#mainTable').children().children().first().after(row);
                }
                contactList.forEach(function(contact,j){
                    if(call.CRM_ENTITY_ID==contact.ID){
                        if (contact.COMPANY_ID!=null){
                            
                           
                            companyList.forEach(function(company,h){
                                 
                                if (company.ID==contact.COMPANY_ID){
                                    callTime=(Math.floor(call.CALL_DURATION / 60)) + ':' + (call.CALL_DURATION % 60);
                                    if (call.CALL_TYPE==1){
                                        row=`<tr><td>${rowNumber}</td><td>${company.TITLE}</td><td>1</td><td>${contact.LAST_NAME}</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Исходящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                                    } else{
                                        row=`<tr><td>${rowNumber}</td><td>${company.TITLE}</td><td>1</td><td>${contact.LAST_NAME}</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Входящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                                    } 
                                    $('#mainTable').children().children().last().after(row);
                                    rowNumber++;
                                }
                            });
                        } else {
                            
                            callTime=(Math.floor(call.CALL_DURATION / 60)) + ':' + (call.CALL_DURATION % 60);
                            if (call.CALL_TYPE==1){
                                console.log(call);
                                row=`<tr><td>${rowNumber}</td><td>Не закреплены</td><td>1</td><td>${contact.LAST_NAME}</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Исходящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                            } else{
                                row=`<tr><td>${rowNumber}</td><td>Не закреплены</td><td>1</td><td>${contact.LAST_NAME}</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Входящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                            } 
                            $('#mainTable').children().children().last().after(row);
                            rowNumber++;
                        }
                    }                    
                });
            });
        }
    });
    $(document).on('click','.detailsForCalls',function(){
        companyNumber=$(this).parent().attr('class');
        if(leadCalls.length>0){
            
            leadCalls.forEach(function(call,i){
                console.log(call);
                if (call.CRM_ENTITY_ID!=null){
                    leadID.push(call.CRM_ENTITY_ID);
                }
                if (i==(leadCalls.length-1)){
                    setTimeout(function(){
                        BX24.callMethod("crm.lead.list", { filter:{ID:leadID},select: [ "ID", "TITLE" ]	},function(result){
				            if(result.error()){
                                console.error(result.error());
                            } else {                    
					            result.data().forEach(function(lead,i){
                                    leadList.push(lead);
                                });			
                                if(result.more()&&leadList.length%100==0){
                                    setTimeout(function(){
                                        console.log("Leads: "+leadList.length);
                                        result.next(); 
                                    },500);
                                } else if(result.more()) {
                                    result.next();
                                } else{
                                    console.log("Leads found");
                                    console.log("Leads: "+leadList.length);
                                        
        leadCalls.forEach(function(call,i){            
            leadList.forEach(function(lead,j){
                
                if (call.CRM_ENTITY_ID==lead.ID){
                   callTime=(Math.floor(call.CALL_DURATION / 60)) + ':' + (call.CALL_DURATION % 60);                        
                   if (call.CALL_TYPE==1){
                       row=`<tr class="detailRow${companyNumber}"><td>${subRowNumber}</td><td>${lead.TITLE}</td><td>1</td><td>${call.PHONE_NUMBER}</td><td>${leadCalls[i].CALL_START_DATE}</td>  <td>${callTime}</td><td>Исходящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                    } else{
                        row=`<tr class="detailRow${companyNumber}"><td>${subRowNumber}</td><td>${lead.TITLE}</td><td>1</td><td>${call.PHONE_NUMBER}</td><td>${call.CALL_START_DATE}</td><td>${callTime}</td><td>Входящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${call.CALL_START_DATE.substr(0,4)}-${call.CALL_START_DATE.substr(5,2)}/${call.CALL_START_DATE.substr(0,10)}_${call.CALL_START_DATE.substr(11,2)}-${call.CALL_START_DATE.substr(14,2)}-${call.CALL_START_DATE.substr(17,2)}__${call.PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
                    }                     
                    if (subRowNumber==1){   
                        $('.clickedForDetails').parent().after(row);
                        subRowNumber++;
                    } else {
                        $(`.detailRow${companyNumber}`).last().after(row);
                        subRowNumber++;                       
                    }    
                }
            });
        });
                                        
                                    
                    
                                 
                               
        
                                }
				            }
			             }
		              );
                    },50);
                }
            });
        }        
        for (i=0;i<unknownCalls.length;i++){ 
            console.log(unknownCalls[i]);
            callTime=(Math.floor(unknownCalls[i].CALL_DURATION / 60)) + ':' + (unknownCalls[i].CALL_DURATION % 60);                        
            if (unknownCalls[i].CALL_TYPE==1){
                row=`<tr class="detailRow${companyNumber}"><td>${subRowNumber}</td><td>Не закреплены</td><td>1</td><td>${unknownCalls[i].PHONE_NUMBER}</td><td>${unknownCalls[i].CALL_START_DATE}</td><td>${callTime}</td><td>Исходящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${unknownCalls[i].CALL_START_DATE.substr(0,4)}-${unknownCalls[i].CALL_START_DATE.substr(5,2)}/${unknownCalls[i].CALL_START_DATE.substr(0,10)}_${unknownCalls[i].CALL_START_DATE.substr(11,2)}-${unknownCalls[i].CALL_START_DATE.substr(14,2)}-${unknownCalls[i].CALL_START_DATE.substr(17,2)}__${unknownCalls[i].PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
            } else{
                row=`<tr class="detailRow${companyNumber}"><td>${subRowNumber}</td><td>Не закреплены</td><td>1</td><td>${unknownCalls[i].PHONE_NUMBER}</td><td>${unknownCalls[i].CALL_START_DATE}</td><td>${callTime}</td><td>Входящий</td><td><a target="_blank" href="https://m2m-sib.bitrix24.ru/docs/file/Телефония%20-%20записи%20звонков/${unknownCalls[i].CALL_START_DATE.substr(0,4)}-${unknownCalls[i].CALL_START_DATE.substr(5,2)}/${unknownCalls[i].CALL_START_DATE.substr(0,10)}_${unknownCalls[i].CALL_START_DATE.substr(11,2)}-${unknownCalls[i].CALL_START_DATE.substr(14,2)}-${unknownCalls[i].CALL_START_DATE.substr(17,2)}__${unknownCalls[i].PHONE_NUMBER}.mp3">скачать</a></td></tr>`;
            }                    
            if (subRowNumber==1){   
                $('.detailsForCalls').parent().after(row);
                subRowNumber++;
            } else {
                $(`.detailRow${companyNumber}`).last().after(row);
                subRowNumber++;                       
            }                    
        }
        
        $(this).attr('class','clickedForDetails');
    }); 
    $(document).on('click','.clickedForDetails',function(){
        companyNumber=$(this).parent().attr('class');            
        $(`.detailRow${companyNumber}`).hide();
        subRowNumber=1;
        leadID=[],leadList=[];
        $(this).attr('class','detailsForCalls');
    });
}); 



