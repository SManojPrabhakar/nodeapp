import { userdata,user,logout,Login } from "./model.js";


async function updateUIOnLogin() {

  const result=await userdata()

  if (
    result.message === "Unauthorized: Token expired" ||
    result.message === "Unauthorized: Invalid token" ||
    result.message === "Unauthorized: Token verification failed"
  ) {
  
    document.getElementById('login').style.display='inline-block'
    document.getElementById('signup').style.display='inline-block'
    document.getElementById('down').style.display = 'none';
  
    document.getElementById('profile').style.display = 'none';
    username.style.display = 'none';
    document.getElementById("session-popup").style.display = "flex";
    return;
  }else{
  document.getElementById('signup').style.display='none'
  document.getElementById('login').style.display='none'
  document.getElementById('down').style.display = 'inline-block';
  
  document.getElementById('profile').src = result.message.profilepic;

  const username=document.getElementById('userame')

  username.style.display = 'inline-block';
username.innerText=result.message.Fullname;
const iconElement = document.createElement('i');
    iconElement.className = 'fas fa-caret-down';
    username.appendChild(iconElement);
  setTimeout(function () {
    document.getElementById("overlay").style.display = "none";
  }, 2000);
}
}

 document.getElementById('ton').addEventListener('click', async function(){
   
    const result= await logout()
  
    if(result.message ==="logged out"){
      window.location.reload(); 
    updateUIOnLogout()
   
    }
  })
// Function to update UI on logout
function updateUIOnLogout() {
  
  
  document.getElementById('down').style.display = 'none';
    document.getElementById('profile').style.display='none'
    
  document.getElementById('userame').style.display = 'none';
  document.querySelector('.dropdown-content').style.display = 'none';

}

async function loginstatus(){
  const result=await user()
  if (result.success) {
  
    updateUIOnLogin();
 
   
  } else {
   
    updateUIOnLogout();
  
  }
  
  }

  loginstatus()

document.getElementById('userame').addEventListener('click', async function(){
  var dropdownContent = document.querySelector('.dropdown-content');

  // Toggle the display property between 'none' and 'block'
  if (dropdownContent.style.display === 'none' || dropdownContent.style.display === '') {
      dropdownContent.style.display = 'block';
  } else {
      dropdownContent.style.display = 'none';
  }
})






document.getElementById('loged').addEventListener('click', async function() {
  var username = document.getElementById('username');
  var password = document.getElementById('password');
  var passwordError = document.getElementById('passwordError');
  var usernameError = document.getElementById('usernameError');

  passwordError.innerHTML = "";
  usernameError.innerHTML = "";

  try {
    // Validate and sanitize user inputs before sending to the server
    if (!username.value || !password.value) {
      throw new Error("Username and password are required.");
    }

    let result = await Login(username.value, password.value);
 
    if (result.message === "College not found") {
      passwordError.innerHTML = "Invalid username and password";
    } else {
      window.location.reload();
      updateUIOnLogin()
      
    }
  } catch (error) {
    console.error("Error:", error);
    // Handle the error (e.g., display an error message to the user)
  }
});





  

document.getElementById('submitBtn').addEventListener('click', async function () {

    var issues = document.getElementById("issues");
    var fullName = document.getElementById("fullName");
    var emailAddress = document.getElementById("email");
    var message = document.getElementById("message");

    var issuesError = document.getElementById("issuesError");
    var fullNameError = document.getElementById("fullNameError");
    var emailAddressError = document.getElementById("emailError");
    var messageError = document.getElementById("messageError");

    issuesError.innerHTML = "";
    fullNameError.innerHTML = ""; 
    emailAddressError.innerHTML = ""; 
    messageError.innerHTML = "";

    // Validation for "issues"
    if (issues.value == null || issues.value === "How may I help you?") {
        issuesError.innerHTML = "Please select an issue";
    }

    // Validation for "fullName"
    if (fullName.value.trim() === "") {
        fullNameError.innerHTML = "Please enter your full name";
    }

    // Validation for "emailAddress"
    if (emailAddress.value.trim() === "") {
        emailAddressError.innerHTML = "Please enter your email address";
    }

    // Validation for "message"
    if (message.value.trim() === "") {
        messageError.innerHTML = "Please enter your feedback message";
    }

});


window.onload = function() {
  var progressBar = document.querySelector('#loading .loader');
  
  var conten = document.getElementById('conte');

  // Increment progress bar width every 10 milliseconds
  var online = navigator.onLine;
  var width = 0;
  var interval = setInterval(function() {
      if (width >= 100 && online) {
          clearInterval(interval);
          document.getElementById('loading').style.display = 'none';
        
           conten.style.display='block'// Hide progress bar
      } else {
          width++;
          progressBar.style.width = width + '%';
      }
  }, 10);
};