
import { Login,user, userdata
    ,logout,collegenames,verification,userlog,right,founderlog } from './model.js';
  
  let timeInSeconds
  let countdownInterval
  
  
  
  document.getElementById('Email').addEventListener('input', async function() {
    await toggleVerifyButton();
   });
   
   
   async function toggleVerifyButton() {
     var emailInput = document.getElementById('Email').value;
     var verifyButton = document.getElementById('verifyButton');
   
        if (!emailInput) {
         var otpSection = document.querySelector('.otp');
     otpSection.style.display = 'none'; // Use 'flex' to show the OTP inputs
         verifyButton.disabled = true;
         timeInSeconds=null;
      stopCountdown()
         return;
     }
     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
     if (isValidEmail) {
         // Clear error message if the email is valid
        $ ('#EmailError').text('').css('color', 'red');
         verifyButton.disabled=false;
         
       
   
     } else {
         // Display error message if the email is not valid
      
         var otpSection = document.querySelector('.otp');
         otpSection.style.display = 'none'; // Use 'flex' to show the OTP inputs
             verifyButton.disabled = true;
             timeInSeconds=null;
           
            
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
    const inputElements = [num1Input, num2Input, num3Input, num4Input,num5Input];
    
    inputElements.forEach(input => {
      input.addEventListener('input', () => {
       
        otp(num1Input.value, num2Input.value, num3Input.value, num4Input.value,num5Input.value);
      });
    });
    }
    
    async function otp(num1, num2, num3, num4, num5) {
      var combinedValue = num1 + num2 + num3 + num4 +num5;
    
      // Check if the combined value has a length of 4
      if (combinedValue.length === 5) {
        const result = await right(combinedValue);
        const Image = document.createElement('img');
     if(result.message === 'OTP verification successful'){
          const otpResultContainer = document.getElementById('otpResult');
         
       
                    Image.src = 'im.png'; 
                  Image.alt = 'Success Image';
                    Image.height=50;
                    Image.width=50;
          otpResultContainer.appendChild(Image);
          document.getElementById('subsignup').disabled = false;
        }
      else{
      
        const otpResultContainer = document.getElementById('otpResult');
  
                    Image.src = 'wong.png'; 
                    Image.alt = 'Unsuccessful Image';
                    Image.height=50;
                    Image.width=50;
          otpResultContainer.appendChild(Image);
       
      }
      setTimeout(function () {
        const otpResultContainer = document.getElementById('otpResult');
        otpResultContainer.innerHTML = "";
      }, 5000); // Adjust the delay as needed
    }
    }

    
   document.getElementById('verifyButton').addEventListener('click', async function verify() {
    try {
      var emailInput = document.getElementById('Email').value;
      timeInSeconds=30
      startCountdown()
  showOTP()
  const result = await verification(emailInput);
  hello();
  
    } catch (error) {
    
        console.log(error);
    }
  });
  
   function showOTP() {
    // Toggle the visibility of the OTP input fields
    var otpSection = document.querySelector('.otp');
    otpSection.style.display = 'flex'; // Use 'flex' to show the OTP inputs
  
    // Optionally, you can disable the "Verify" button after displaying OTP
    var verifyButton = document.querySelector('.btn-primary');
   
  }
  
  function startCountdown() {
    // Disable the button
    const countdownButton = document.getElementById('verifyButton');
  
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
    const countdownButton = document.getElementById('verifyButton');
     
  
    clearInterval(countdownInterval); // Stop the countdown
    countdownButton.innerText = "verify";
    countdownButton.disabled = true;
  }
  const selectElement = document.getElementById('Administration');

  
  // Add event listener for the change event
  selectElement.addEventListener('change', function() {
      // Get the selected option
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      const college=document.getElementById('collegeselect')
      const Roll=document.getElementById('Id')
      const Rolllabel=document.getElementById('Ids')
      const RollError=document.getElementById('IdError')
    
      // Get the value of the selected option
      const selectedValue = selectedOption.value;
      console.log(selectedValue)
      switch (selectedValue) {
        case "Student":
          college.style.display = 'none';
          Roll.style.display = 'inline-block';
          Rolllabel.style.display = 'inline-block';
          RollError.style.display = 'inline-block';
          
         
          collage_name();
          break;
        case "Lecturer":
          college.style.display = 'block';
         
          
          Roll.style.display = 'inline-block';
          Rolllabel.style.display = 'inline-block';
          RollError.style.display = 'inline-block';
      
          collage_name();
          break;
          case "Admin":
            college.style.display = 'block';
           
            Roll.style.display = 'inline-block';
            Rolllabel.style.display = 'inline-block';
            RollError.style.display = 'inline-block';
         
            break;
          case "Founder":
      
          college.style.display='none'
        Roll.style.display = 'none';
          Rolllabel.style.display = 'none';
          RollError.style.display = 'none';
          
          collage_name();
          break;
        default:
          // Handle default case if needed
          break;
      }
      
         
  });
   
  
  async function collage_name() {
    try {
        // Call the collegenames function to get the results
        const res = await collegenames();
       
        // Get the select element
        const selectElement = document.getElementById('collagesele');
        
        // Clear any existing options
        selectElement.innerHTML = '';
        // If no colleges are registered
        if (res.message === "college is not registered") {
            const option = document.createElement('option');
            option.value = ''; // Set the value of the option to empty string or whatever is appropriate
            option.textContent = '--No college registered--'; // Set the text content of the option
            selectElement.appendChild(option); // Append the option to the select element
        } else {
            // Create and append new options based on the result data
            res.forEach(college => {
                const option = document.createElement('option');
                option.value = college.college_name; // Set the value of the option
                option.textContent = college.college_name; // Set the text content of the option
                selectElement.appendChild(option); // Append the option to the select element
            });
        }
    } catch (error) {
        console.error('Error:', error);
        // Handle error
    }
  }
  
  
  document.getElementById('login').addEventListener('click', function(){
    document.getElementById("overlay").style.display = "flex";
  })
  
  
  document.getElementById('signup').addEventListener('click', function(){
    document.getElementById("overlay2").style.display = "flex";
  })
  
 
  document.getElementById('xmark').addEventListener('click', async function(){
    document.getElementById("overlay").style.display = "none";
  })
  
  document.getElementById('xmark2').addEventListener('click', async function(){
    document.getElementById("overlay2").style.display = "none";
  })
            // Add this in your <script> tag or external JavaScript file (e.g., madcontroller.js)
  
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
  
  
            document.getElementById('eyeSlash2').addEventListener('click',async function(){
              var passwordInput = document.getElementById('pasword');
              var eyeSlashIcon = document.getElementById('eyeSlash2');
            
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
  
            document.getElementById('eyeSash').addEventListener('click',async function(){
              var passwordInput = document.getElementById('confirmpassword');
              var eyeSlashIcon = document.getElementById('eyeSash');
            
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
  
          
  
  
 
  
  
  document.getElementById('logout').addEventListener('click', async function(){
   
    const result= await logout()
  
    if(result.message ==="logged out"){
     
    updateUIOnLogout()
   
    }
  })
  
  function updateUIOnLogout() {
 
    document.getElementById('login').style.display = 'inline-block';
  
    document.getElementById('down').style.display = 'none';
    document.getElementById('Image').style.display = 'none';
    document.getElementById('register').style.display = 'none';
    document.getElementById('userame').style.display = 'none';
    document.querySelector('.dropdown-content').style.display = 'none';
  
  }
  
  
  
  document.getElementById('subsignup').addEventListener('click', async function () {
  
    var Administration = document.getElementById("Administration").value;
    var collegename = document.getElementById("collagesele").value;
    var fullname = document.getElementById("fullname").value;
    var Email = document.getElementById("Email").value;
    var password = document.getElementById("pasword").value;
    var confirmpassword = document.getElementById("confirmpassword").value;
    
    const Year=document.getElementById('Year').value
    const Section=document.getElementById('Section').value
    const Course =document.getElementById('Course').value
    const roll=document.getElementById("Id").value
    const Gender =document.getElementById('Gender').value
  
  
    var AdministrationError = document.getElementById("AdministrationError");
    var qualificationError=document.getElementById("collageseleError")
    var fullnameError = document.getElementById("fullnameError");
    var EmailError = document.getElementById("EmailError");
    var passwordError=document.getElementById('paswordError');
    var rollError=document.getElementById('IdError');
    var confirmpasswordError = document.getElementById("confirmpasswordError");
   
    const YearError=document.getElementById('YearError')
    const SectionError=document.getElementById('SectionError')
    const CourseError =document.getElementById('CourseError')
    const GenderError =document.getElementById('GenderError')
    var check=document.getElementById('agree')
    const checkError =document.getElementById('checkboxError')
  
    AdministrationError.innerHTML = "";
    qualificationError.innerHTML=""
    fullnameError.innerHTML = ""; 
    EmailError.innerHTML = ""; 
    passwordError.innerHTML="";
    confirmpasswordError.innerHTML = "";
 
    YearError.innerHTML="";
    SectionError.innerHTML=""
    CourseError.innerHTML=""
    GenderError.innerHTML=""
    checkError.innerHTML=""
    // Validation for "issues"
    
    if (Administration == null || Administration === "Select role") {
        AdministrationError.innerHTML = "Please select any one of them";
    }
    if (collegename == null || collegename === "Select College") {
      qualificationError.innerHTML = "Please select any one of them";
  }
  
    // Validation for "fullName"
    if (fullname=== "") {
        fullnameError.innerHTML = "Please enter your full name";
    }
    if (roll === "") {
      rollError.innerHTML = "Please enter your reg.no/Id";
  }
    // Validation for "emailAddress"
    if (Email === "") {
        EmailError.innerHTML = "Please enter your email address";
    }
  
    if (Section == null || Section === "Section") {
      SectionError.innerHTML = "Select section";
  }
  if (Year == null || Year === "Year") {
    YearError.innerHTML = "Select Year";
  }
  if (Course == null || Course === "Course") {
    CourseError.innerHTML = "Select Course";
  }
  if (Gender == null || Gender === "Gender") {
    GenderError.innerHTML = "Select Gender";
  }
  

    if (password ==="" ) {
      passwordError.innerHTML = "password must have atleast 8 characters";
  }
    // Validation for "message"
    if (confirmpassword ==="" ||confirmpassword !== password  ) {
        confirmpasswordError.innerHTML = "password doesn't match";
    }
   if(!check.checked){
  checkError.innerHTML="Accept the terms and conditions"
   }
  
    if (
      fullname !== "" &&
      Email !== "" &&
      Administration !== "" &&
      password !== "" &&
      confirmpassword !== "" &&
      collegename === "Select College" &&
      roll === "" &&
      password === confirmpassword && 
      check.checked// Check if password and confirm password match
  ) {
      const done = await founderlog(Administration, fullname, Email, confirmpassword);
      showSignedInPopup(done)
  }
  
      if(fullname !=="" && Email !=="" && Administration !==""  && password !=="" && confirmpassword !==""  && roll !==""&&
      password === confirmpassword){
        
        const done=    await userlog(Administration,roll,collegename,fullname,Email,confirmpassword)
        
        showSignedInPopup(done);
        
        
        }
    
  });

  /*
  function showSignedInPopup(resultmessage) {
    var popup = document.querySelector('.overlay-content3 .popup');
   
    if(resultmessage.success){
   
          
    // Create elements for message and image
    var messageElement = document.createElement('p');
    messageElement.textContent = resultmessage.message;
  
    var imageElement = document.createElement('img');
    imageElement.src = 'im.png';
  
    var button = document.createElement('button');
    button.textContent = 'Login';
    button.style.alignContent='center'
    button.onclick = function() {
      // Close the popup or perform necessary action
      document.getElementById('overlay3').style.display = 'none';
      document.getElementById('overlay2').style.display = 'none';
      document.getElementById('overlay').style.display = 'flex';
    };
  
    popup.innerHTML = '';
  
    // Append message and image to the popup
    popup.appendChild(imageElement);
    popup.appendChild(messageElement);
   popup.appendChild(button);
  
    // Display the overlay
    document.getElementById('overlay3').style.display = 'block';
  }else{
    
          
    // Create elements for message and image
    var messageElement = document.createElement('p');
    messageElement.textContent = resultmessage.message;
  
    var imageElement = document.createElement('img');
    imageElement.src = 'wrong.jpg';
  
    var closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
  
    closeButton.onclick = function() {
      // Close the popup or perform necessary action
      document.getElementById('overlay3').style.display = 'none';
    };
    // Clear existing content
    popup.innerHTML = '';
  
    // Append message and image to the popup
    popup.appendChild(imageElement);
    popup.appendChild(messageElement);
  
    popup.appendChild(closeButton);
    // Display the overlay
    document.getElementById('overlay3').style.display = 'block';
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
  };*/