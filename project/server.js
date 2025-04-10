const express = require('express');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3000;
const IP_ADDRESS="192.168.79.147"

app.use(cookieParser())
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

const reportRoutes = require('./reportRoutes.js');
const collageRoutes = require('./collegeRoutes.js');
const register = require('./register.js');
const routes = require('./pageroutes.js');
const Login = require('./Loginroute.js');
const signup = require('./signup.js');
const Attend = require('./Attendance.js');
const posts = require('./posts.js');
const Userupdates = require('./Userupdates.js');
const Fees = require('./Fees.js');
const Passwords = require('./Passwords.js');
const Blocks=require('./Blocks.js')
const Delete=require('./Delete.js')
const Notify=require('./PushNotifi.js');
const Classes=require('./Classes.js')
const Profile=require('./Profile.js')
const sendOtpRoutes = require('./sendOtpRoutes.js');
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

