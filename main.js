import Teenyat from './teenyAT.js';  // Adjust the path based on your file structure

const DEBUG = 0x9000;

document.getElementById('fileInput').addEventListener('change', handleFileSelect);

const teenyAt = new Teenyat();

function handleFileSelect(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const binaryData = new Uint16Array(e.target.result);
      teenyAt.tny_init_from_file(binaryData,bus_read,bus_write);
    };

    reader.readAsArrayBuffer(file);
  }
}

function update(){
  requestAnimationFrame(update);
  if(teenyAt.initialized){
    teenyAt.tny_clock();
  }
}update();


function bus_read(addr){
  let result = null;
  console.log(`Bus Read: ${addr}`);
  result = {data:69,delay:0}
  return result;
}

function bus_write(addr,data){
  let result = null;
  console.log(`Bus Write: ${addr}`);
  switch(addr){
    case DEBUG:
      console.log(`HEllo ${data}`);
      break;
    default:
        console.log("Unhandled")
  }
  result = {delay:0}
  return result;
}