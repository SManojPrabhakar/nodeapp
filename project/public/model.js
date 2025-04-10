// Model (your-model.js)

// Assuming you have some kind of data structure to store the information

export { sendDataToServer,recentregister,s3images,S3delete,report,verification,
  right,reportingmail,Login,user,userdata,logout,signup,collegenames,userlog,founderlog};
 
  async function collegenames(){
    try{
      const response=await fetch('/colls/collegenames/',{
        method:'Get',
        headers:{
          'Content-Type': 'application/json'
        }
      })
      const result=await response.json();
    
      return result
     
    }
    catch(error){
      console.error('Error sending data to server:', error.message);
    }
  }


async function s3images(Imagekeys) {
  try {
    const formData = new FormData();

    // Iterate through each image and append it to the FormData
    for (let i = 0; i < Imagekeys.length; i++) {
      formData.append(`file`, Imagekeys[i]);
    }

    const response = await fetch('/colls/s3upload/', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    

    return result; // This result will be passed to the calling code (controller.js)
  } catch (error) {
    console.log('Error sending data to server:', error.message);
  }
}

async function logout(){
  try{
    const response=await fetch('/auth/logout/',{
      method:'Get',
      headers:{
        'Content-Type': 'application/json'
      }
    })
    const result=await response.json();
   
    return result
   
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}


async function recentregister(){
  try{
    const response=await fetch('/colls/collages/',{
      method:'Get',
      headers:{
        'Content-Type': 'application/json'
      }
    })
    const result=await response.json();
   
    return result
   
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}


async function user(){
  try{
    
   
    const response = await fetch('/auth/loginstatus/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
     
      }
    })
    const result = await response.json();
  
    return result
   
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}
async function userdata() {
  try {
    const response = await fetch('/auth/collegelogindata/', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}
/*
async function profiledata() {
  try {
    
    const response = await fetch('/pro/profile/web', {
      method: 'GET',
      credentials: 'include', // This ensures cookies are sent
    });

    const result = await response.json();
    console.log(result)
    return result;
  } catch (error) {
    console.error('Error sending data to server:', error.message);
  }
}



async function search(){
  try{
    const response=await fetch('/search/',{
      method:'Get',
      headers:{
        'Content-Type': 'application/json'
      }
    })
    const result=await response.json();
    const collegeNamesArray = result.map(college => college.collage_name.toString());
    return collegeNamesArray
   
  }
  catch(error){
    console.log('Error sending data to server:', error.message);
  }
}
*/

async function Login(Email,password){
  try{
    const response=await fetch(`/auth/collegelogin/`,{
      method:'post',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      
        Email,password
       }),credentials:'include'
    })
    const result=await response.json();

   return result
  }
  catch(error){
    console.error('Error sending data to server:', error.message);
  }
}


async function reportingmail( 

  Email,
  full_name,
  orgina,
  city,
  
) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/issue/reporting/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
    
      Email,
    full_name,
      orgina,
      city,
     
      
    })
  })
 const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


async function report( 
  full_name,
  Email,
  mobilenumber,
  report_name,
  city,
  message
) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/issue/repo/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
      full_name,
      Email,
      mobilenumber,
      report_name,
      city,
      message
     
      
    })
  })
 const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}



async function verification( 
  
  Email,
  
) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('/otp/send-otp/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
      
      Email})
  })
  const result = await response.json();
  console.log(result.token)
  sessionStorage.setItem('token', result.token);
  
return result // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}

async function right( 
  
  otp,
  
) {
  // You can use fetch or any other method to send data to the server
  try{
    const token = sessionStorage.getItem('token');
   
    const response=await fetch('otp/verify-otp', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
      token,
      otp
     
     
      
    })
  })
 const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}

async function signup( type,qualification,fullname,email,
 password) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('auth/signup/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      qualification,
      fullname,
      email,
      password
     
      
    })
  })
 

const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}
async function S3delete(key) {
  try {
    console.log(key)
      
    const response = await fetch(`colls/s3delete/${key}`, {
      method: 'DELETE', // Uppercase 'DELETE' method
    });

    const result = await response.json();
    console.log(result);
    return result; // This result will be passed to the calling code (controller.js)
  } catch (error) {
    console.error('Error sending data to server:', error.message);
    // Handle errors if needed
    throw error;
  }
}

async function founderlog( Role,Username,Email,password) {
  // You can use fetch or any other method to send data to the server
  try{
 console.log( Role,Username,Email,password)
    const response=await fetch('sin/fosignup/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
      
      Username,
      Email,
      Role,
      password
      
    })
  })
 

const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


async function userlog( Role,Reg,Username,collegename,Email,password) {
  // You can use fetch or any other method to send data to the server
  try{

    const response=await fetch('sin/ussignup/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      
     Username,
      Reg,
      Email,
      Role,
      collegename,
      password
      
    })
  })
 

const result = await response.json();
console.log(result)
return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}



async function sendDataToServer(State,
  College_Type,
  College_Code,
  College_Name,
  College_Email,
  College_Number,Principal,Imagekeys,P_Email,College_Address,) {
  // You can use fetch or any other method to send data to the server
  try{
    
    const response=await fetch('reg/register/', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json',
     
    },
    credentials: 'include',
    body: JSON.stringify({
      
      State,
      College_Type,
      College_Code,
      College_Name,
      College_Email,
      College_Number,
      Principal,
      Imagekeys,
      P_Email,
      College_Address
      
    })
  })
 

const result = await response.json();

return result; // This result will be passed to the calling code (controller.js)
} catch (error) {
console.log('Error sending data to server:', error.message);

}
}


