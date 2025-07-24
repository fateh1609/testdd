const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { User } = require('../../models');

exports.list = async (req,res) => {
  const q = req.query.q || '';
  const users = await User.findAll({
    where:{
      [Op.or]:[
        { username:{ [Op.iLike]: `%${q}%` } },
        { email:{ [Op.iLike]: `%${q}%` } }
      ]
    },
    attributes:['id','username','email','firstName','lastName','canWithdraw','loginActive','lendingAllowed']
  });
  res.json(users);
};

exports.toggleFlags = async (req,res)=>{
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error:'User not found' });
  ['canWithdraw','loginActive','lendingAllowed'].forEach(k=>{
    if (k in req.body) user[k]=req.body[k];
  });
  await user.save();
  res.json({ ok:true });
};

exports.resetCreds = async (req,res)=>{
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error:'User not found' });

  if (req.body.password)
    user.passwordHash = await bcrypt.hash(req.body.password,10);
  if (req.body.pin)
    user.pinHash = await bcrypt.hash(req.body.pin,10);

  await user.save();
  res.json({ ok:true });
};
