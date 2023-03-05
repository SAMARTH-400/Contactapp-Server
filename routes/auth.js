const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const auth = require("../middlewares/auth");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  // check missing fields
  if (!name || !email || !password){
    return res.status(400).json({ error: `Please enter all the required field.` });
  }
  // email validation
  const emailReg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (!emailReg.test(email)) {
    return res.status(400).json({ error: "please enter a valid email address." });
  }
    try {
      const doesUserAlreadyExist = await User.findOne({ email });
      if (doesUserAlreadyExist){
        return res.status(400).json({
          error: `a user with that email [${email}] already exists try Signing in`,
        });
      } 
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword });
      
      // save the user
      const result = await newUser.save();
      result._doc.password = undefined;
      return res.status(201).json({ ...result._doc });
    } catch(err){
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async(req, res) => {
  const { email, password } = req.body;
  
  // check missing fields
  if(!email || !password){
    return res.status(400).json({ error: "please enter all the required fields!" });
  }
  
  try {
    const ExistingUser = await User.findOne({ email });
    if(!ExistingUser){
      return res.status(400).json({ error: "Invalid email or password!" });
    }
    const correctPassword = await bcrypt.compare(
      password,
      ExistingUser.password
    );
    if (!correctPassword){
      return res.status(400).json({ error: "Invalid email or password!" });
    }
    
    const payload = { _id: ExistingUser._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const user = { ...ExistingUser._doc, password: undefined };
    return res.status(200).json({ token, user });
  } catch(err){
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/me", auth, async (req, res) => {
  return res.status(200).json({ ...req.user._doc });
});

module.exports = router;
