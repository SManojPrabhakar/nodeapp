const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3000;
const IP_ADDRESS="192.168.52.147"

app.use(cookieParser())
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

const reportRoutes = require('D:/Data/project/reportRoutes.js');
const collageRoutes = require('D:/Data/project/collegeRoutes.js');
const register = require('D:/Data/project/register.js');
const routes = require('D:/Data/project/pageroutes.js');
const Login = require('D:/Data/project/Loginroute.js');
const signup = require('D:/Data/project/signup.js');
const Attend = require('D:/Data/project/Attendance.js');
const posts = require('D:/Data/project/posts.js');
const Userupdates = require('D:/Data/project/Userupdates.js');
const Fees = require('D:/Data/project/Fees.js');
const Passwords = require('D:/Data/project/Passwords.js');
const Blocks=require('D:/Data/project/Blocks.js')
const Delete=require('D:/Data/project/Delete.js')
const Notify=require('D:/Data/project/PushNotifi.js');
const Classes=require('D:/Data/project/Classes.js')
const Profile=require('D:/Data/project/Profile.js')
const sendOtpRoutes = require('D:/Data/project/sendOtpRoutes.js');
// Middleware...
app.use('/', routes);
app.use('/otp', sendOtpRoutes);
app.use('/issue', reportRoutes);
app.use('/colls', collageRoutes);
app.use('/reg', register);
app.use('/auth', Login);
app.use('/sin', signup);
app.use('/attend',Attend)
app.use("/po",posts)
app.use("/userup",Userupdates)
app.use("/fee",Fees)
app.use("/Pass",Passwords)
app.use("/Block/",Blocks)
app.use("/del/",Delete)
app.use("/Notify/",Notify)
app.use("/class/",Classes)
app.use("/pro",Profile)
// Other routes...
app.listen(PORT,IP_ADDRESS,() => {
    console.log(`Server is running on port ${PORT}`);
  });

