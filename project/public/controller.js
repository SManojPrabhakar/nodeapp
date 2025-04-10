// Controller (your-controller.js)

import { sendDataToServer,s3images,right,verification, S3delete,userdata,Login,logout,user} from './model.js';



let timeInSeconds;
let countdownInterval;
let Id;



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
      
      updateUIOnLogin()
    }
  } catch (error) {
    console.error("Error:", error);
    // Handle the error (e.g., display an error message to the user)
  }
});

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
  document.getElementById('profile').style.display = 'inline-block';      
  const username=document.getElementById('userame')

  username.style.display = 'inline-block';
username.innerText=result.message.Fullname;
const iconElement = document.createElement('i');
    iconElement.className = 'fas fa-caret-down';
    username.appendChild(iconElement);
  setTimeout(function () {
    document.getElementById("overlay1").style.display = "none";
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

async function loginstatus(){
  const result=await user()
  if (result.success) {
  
    updateUIOnLogin();
 
   
  } else {
   
    updateUIOnLogout();
  
  }
  
  }

  loginstatus()



function updateUIOnLogout() {
  
  document.getElementById('login').style.display = 'inline-block';

  document.getElementById('down').style.display = 'none';
  document.getElementById('profile').style.display = 'none';
 
  document.getElementById('userame').style.display = 'none';
  document.querySelector('.dropdown-content').style.display = 'none';
  document.getElementById("overlay1").style.display = "flex";

}

document.getElementById('eyeSlash').addEventListener('click',async function(){
  var passwordInput = document.getElementById('password');
  var eyeSlashIcon = document.getElementById('eyeSlash');

  if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeSlashIcon.classList.remove('fa-eye-slash');
      eyeSlashIcon.classList.add('fa-eye');
  } else {
      passwordInput.type = 'password';
      eyeSlashIcon.classList.remove('fa-eye');
      eyeSlashIcon.classList.add('fa-eye-slash');
  }
})
document.getElementById('Email').addEventListener('input', async function() {
 await toggleVerifyButton();
});


async function toggleVerifyButton() {
  var emailInput = document.getElementById('Email').value;
  var verifyButton = document.getElementById('verification');

     if (!emailInput) {
      var otpSection = document.querySelector('.otp');
  otpSection.style.display = 'none'; // Use 'flex' to show the OTP inputs
      verifyButton.disabled = true;
    
   stopCountdown()
      return;
  }
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
  if (isValidEmail) {
      // Clear error message if the email is valid
      $('#collageEmailError').text('').css('color', 'red');
      verifyButton.disabled=false;

  } else {
      // Display error message if the email is not valid
   
      var otpSection = document.querySelector('.otp');
      otpSection.style.display = 'none'; // Use 'flex' to show the OTP inputs
          verifyButton.disabled = true;
          verifyButton.innerText="verify"
    stopCountdown()
  }
}



async function hello(){
const num1Input = document.getElementById('digit1');
const num2Input = document.getElementById('digit2');
const num3Input = document.getElementById('digit3');
const num4Input = document.getElementById('digit4');
const num5Input = document.getElementById('digit5');
// Store all input elements in an array
const inputElements = [num1Input, num2Input, num3Input, num4Input, num5Input];

inputElements.forEach(input => {
  input.addEventListener('input', () => {
   
    otp(num1Input.value, num2Input.value, num3Input.value, num4Input.value, num5Input.value);
  });
});
}

async function otp(num1, num2, num3, num4, num5) {
  var combinedValue = num1 + num2 + num3 + num4 + num5;

  // Check if the combined value has a length of 4
  if (combinedValue.length === 5) {
    const result = await right(combinedValue);
    
 if(result.success){
      const otpResultContainer = document.getElementById('otpResult');
      otpResultContainer.innerHTML = '';
      const successImage = document.createElement('img');
                successImage.id="suImg"
                successImage.src = 'im.png'; 
                successImage.alt = 'Success Image';
                successImage.height=50;
                successImage.width=50;
      otpResultContainer.appendChild(successImage);
      document.getElementById('nxt').disabled = false;
    }
  else{
  
    const otpResultContainer = document.getElementById('otpResult');
    otpResultContainer.innerHTML = '';
    const successImage = document.createElement('img');
                successImage.id="faimg"
                successImage.src = 'wrong.jpg'; 
                successImage.alt = 'Success Image';
                successImage.height=50;
                successImage.width=50;
      otpResultContainer.appendChild(successImage);
    document.getElementById('nxt').disabled = true;
  }
  setTimeout(function () {
    const otpResultContainer = document.getElementById('otpResult');
    otpResultContainer.innerHTML = "";
  }, 5000); // Adjust the delay as needed
}
}

// Function to handle image upload
/*async function handeImageUpload() {
  const images = document.getElementById('file-input').files;

  // Check if there are any files
  if (images.length > 0) {
      // Loop through each file
      for (let i = 0; i < images.length; i++) {
          console.log(images[i].name); // Log the name of each file
          // You can perform any further processing with the files here
      }
  } else {
      console.log("No files selected.");
  }
}

// Add event listener for change event on file input
document.getElementById('file-input').addEventListener('change', handeImageUpload);
*/


async function handelImageUpload() {
  try {
    
      const images = document.getElementById('file-input');
    const Imagekeys = images.files;
   
const  imageUploadError=""
      if (!Imagekeys || Imagekeys.length === 0) {
      
          // Success case
          const popupContent = document.getElementById('popupContent');
          const imageElement = document.createElement('img');
          imageElement.src = 'wrong.jpg'; // Replace with the actual path to your image
          imageElement.alt = 'Selected Image';
          imageElement.height=80;
          imageElement.width=80;
         
          popupContent.innerText ='Image is not selected';
        
          popupContent.appendChild(imageElement);
      
          // Show the popup container and overlay
          const popupContainer = document.getElementById('popupContainer');
          const overlay = document.getElementById('overlay');
          popupContainer.style.display = 'block';
          overlay.style.display = 'block';
        
      }else{
         const keys = await s3images(Imagekeys);
         return keys
       } // Optionally, you can send the image keys to the model
      // const result = await sendImageKeysToModel(keys);
  } catch (error) {
      console.log('Error handling image upload:', error);
  }
}

document.getElementById('verification').addEventListener('click', async function verify() {
  try {
    var emailInput=document.getElementById('Email').value;
    
    timeInSeconds=30;
    startCountdown()
const result = await verification(emailInput);

        
          hello();
      
  } catch (error) {
  
      console.log(error);
  }
});

function startCountdown() {
  // Disable the button
  const countdownButton = document.getElementById('verification');

  
  countdownButton.disabled = true;

  // Set the initial time in seconds
 

  // Update the button text every second
   countdownInterval = setInterval(() => {
      countdownButton.innerText = `resend ${timeInSeconds}'s`;

      // Check if the countdown has reached 0
      if (timeInSeconds <= 0) {
          clearInterval(countdownInterval); // Stop the countdown
          countdownButton.innerText="resend"
          countdownButton.disabled = false;
      } else {
          timeInSeconds--;
      }
  }, 1000);
}




function stopCountdown() {
  const countdownButton = document.getElementById('verification');
  clearInterval(countdownInterval); // Stop the countdown
  timeInSeconds=" ";
  countdownButton.disabled = true;
  
}



document.getElementById('submitBtn').addEventListener('click', async function () {
   
  const token = localStorage.getItem('token');
  
const key=await handelImageUpload()

try{
  // Get user input from the View
 var state = document.getElementById("state").value;
var Collage_Type = document.getElementById("collageType").value;
var  Collage_Code = document.getElementById("Code").value
var  Collage_Name = document.getElementById("collageName").value
 var  Collage_Email= document.getElementById("Email").value
 var  Collage_Address = document.getElementById("collageAddress").value
 var  Collage_Admin_Number = document.getElementById("collageLandline").value
var  Principal = document.getElementById("Principal").value
 var mail = document.getElementById("mail").value

if(key[0] !==  'undefined'){
    const result = await sendDataToServer(
      
      state,
      Collage_Type,
      Collage_Code,
      Collage_Name,
      Collage_Email,
      Collage_Admin_Number,Principal,key[0],mail,Collage_Address);


    
    if (result.success) {
        // Success case
        const popupContent = document.getElementById('popupContent');
        popupContent.innerText = result.message;

        // Show the popup container and overlay
        const popupContainer = document.getElementById('popupContainer');
        const overlay = document.getElementById('overlay');
        popupContainer.style.display = 'block';
        overlay.style.display = 'block';
    } else {
 
        const popupContent = document.getElementById('popupContent');

        // Create the image element
        const imageElement = document.createElement('img');
        imageElement.src = 'wrong.jpg'; // Replace with the actual path to your image
        imageElement.alt = 'Selected Image';
        imageElement.height = 80;
        imageElement.width = 80;
        
        // Append the image element to the popupContent
        popupContent.appendChild(imageElement);
        
        // Set the text below the image
        popupContent.innerText = result.message;
        console.log(result.message)
        // Show the popup container and overlay
        const popupContainer = document.getElementById('popupContainer');
        const overlay = document.getElementById('overlay');
        popupContainer.style.display = 'block';
        overlay.style.display = 'block';
        await S3imagedelete(key[0])
    }
    // You can perform additional actions based on the result
  }
} catch (error) {
    // Handle errors if needed
   
    const popupContent = document.getElementById('popupContent');
    popupContent.innerText = error.message || 'An error occurred';

    // Show the popup container and overlay
    const popupContainer = document.getElementById('popupContainer');
    const overlay = document.getElementById('overlay');
    popupContainer.style.display = 'block';
    overlay.style.display = 'block';
    console.error('Error in controller:', error);
    await S3imagedelete(key[0])
}

// You can also do any additional processing or validation here

// Optional: Prevent the default form submission (if using a form element)
// event.preventDefault();
});
async function S3imagedelete(key) {
  try {
    
      const images = document.getElementById('file-input');
    const Imagekeys = images.files;


       const eys = await S3delete(key);
         
      
  } catch (error) {
      console.error('Error handling image upload:', error);
  }
}


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


