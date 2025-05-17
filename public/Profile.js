// Controller (your-controller.js)
/*
import { sendDataToServer,s3images,right,verification, S3delete,userdata,Login,logout,user} from './model.js';






document.getElementById('logout').addEventListener('click', async function(){
  const result= await logout()
  if(result.message ==="logged out"){
  updateUIOnLogout()
  }
})

document.getElementById('userame').addEventListener('click', async function(){
  var dropdownContent = document.querySelector('.dropdown-content');

  // Toggle the display property between 'none' and 'block'
  if (dropdownContent.style.display === 'none' || dropdownContent.style.display === '') {
      dropdownContent.style.display = 'block';
  } else {
      dropdownContent.style.display = 'none';
  }
})



async function loginstatus(){
  const result=await user()
  console.log(result.code)
  checkLoginStatus(result.code)
  
  }
  loginstatus()
  
  async function checkLoginStatus(result) {
   
  
    if (result) {
  
      updateUIOnLogin();
     
    } else {
      updateUIOnLogout();
    }
  }
  checkLoginStatus()


  async function updateUIOnLogin() {

    const result=await userdata()
  
  console.log(result)
   if(result.success){
    
    Id=result.message.Id;
    const username=document.getElementById('userame')
  
    username.style.display = 'inline-block';
  username.innerText=result.message.Username;
  const iconElement = document.createElement('i');
      iconElement.className = 'fas fa-caret-down';
      username.appendChild(iconElement);
   
   } else{
    
   updateUIOnLogout()
   }
  }






  /*{
 
    "Name": "Manojpra",
    "Year":"1",
    "Section":"B",
    "Number":9701834012,
    "Sem":"2",
    "Email":"taffy123@gmail.com",
    "Gaurdian":"Prabha",
    "Gender":"F",
    "Course":"ECE"
    
  }*/





