/*import { profiledata } from './model.js';

async function Prodata() {
  try {
    const result = await profiledata(); // Fetch profile data
 
  
    const attendanceSection = document.querySelector('.attendance-status');
    // Ensure the result contains a 'message' with user details
    if (result && result.message) {
      const userDetails = result.message;

      document.getElementById('username-display').textContent = result.message.fullname;
      document.getElementById('name').textContent = userDetails.fullname
      document.getElementById('profileimg').src = userDetails.profilepic || userDetails.Profile;
      document.getElementById('profileim').src = userDetails.profilepic || userDetails.Profile;
      document.getElementById('Email').textContent = userDetails.Email 
      document.getElementById('college').textContent = userDetails.College_name 
      document.getElementById('regno').textContent = userDetails.regno
      document.getElementById('number').textContent = userDetails.Number || "Not given yet"
document.getElementById('address').textContent = userDetails.Address || "Not given yet"
      if(userDetails.Role=="Student"){
        document.getElementById('Attpercent').textContent = "Attendance Percentage"
        document.getElementById('year').textContent = userDetails.year+" Year" 
      document.getElementById('course').textContent = userDetails.Course 
      document.getElementById('percentage').textContent = (userDetails.classes_present/userDetails.total_classes)*100+"%"
      }

    if(userDetails.Role=="Lecturer"){
      attendanceSection.style.display = 'none';
      document.getElementById('designation').textContent = userDetails.Desigination
      document.getElementById('department').textContent = userDetails.Department
      }
      // Update profile image if available
    }
  } catch (error) {
    console.error('Error fetching profile data:', error);
  }
} 


// Call the function to load the data
Prodata();
*/