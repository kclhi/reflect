function sendPostRequest(endpoint, body, callback, contentType='application/json') {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint, true);
  if(contentType) xhr.setRequestHeader('Content-Type', contentType);
  xhr.onreadystatechange = function() {
    if(xhr.readyState===XMLHttpRequest.DONE) {
      var status = xhr.status;
      if (status===0||(status>=200&&status<400)) {
        callback(xhr.response);
      } else {
        console.log('DEBUG: '+status+' '+xhr.statusText);
        callback(null);
      }
    }
  };
  xhr.send(body);
}

function ready(callback){
  if(document.readyState!='loading') callback();
  else if(document.addEventListener) document.addEventListener('DOMContentLoaded', callback)
  else document.attachEvent('onreadystatechange', function(){ if(document.readyState=='complete') callback();});
}
 
function nhsFieldCheck() {
  let input = document.getElementById('nhs-input');
  input.classList.remove('is-danger');
  document.getElementById('nhs-next').disabled=true;
  for(let element of document.getElementsByClassName('nhs-warning')) element.style.display = 'none';
  let nonDigits = !input.value.match(/^\d*(\.\d+)?$/) 
  let tooLong = input.value.length>10;
  if(nonDigits||tooLong) {
    input.classList.add('is-danger');
    for(let element of document.getElementsByClassName('nhs-warning')) element.style.removeProperty('display');
  }
  if(!nonDigits&&input.value.length==10) document.getElementById('nhs-next').disabled=false;
}

function addNhsFieldCheck() { document.getElementById('nhs').oninput=()=>{nhsFieldCheck();}; }

function showVendors() {
  document.getElementById('nhs').style.display='none';
  document.getElementById('vendors').style.removeProperty('display');
}

function nhsClick() {
  let nhs = document.getElementById('nhs-input').value;
  sendPostRequest('/device/setIdCookie', '{"patientId":"'+nhs+'"}', (response)=>{if(response) console.log('DEBUG: '+response)});
  showVendors();
  window.location = "#vendors";
}

function addNhsClick() { document.getElementById('nhs-next').onclick=()=>{nhsClick();}; }

function go(page, title, url) { 
  if('undefined'!==typeof history.pushState) {
    history.pushState({page:page}, title, url);
  } else {
    window.location.assign(url);
  }
}

function addBackNhsClick() {
  document.getElementById('nhs-back').onclick=()=>{
    document.getElementById('vendors').style.display='none';
    document.getElementById('nhs').style.removeProperty('display');
    const url = new URL(window.location);
    url.hash='';
    go({}, "", url);
  }
}
