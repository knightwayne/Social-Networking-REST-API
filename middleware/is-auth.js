const jwt = require('jsonwebtoken');

module.exports = (req,res,next)=>{
    const token = req.get('Authorization').split(' ')[1];
    //console.log('xxx', token);
    let decodedToken;
    try{
        //console.log(token);
        decodedToken = jwt.verify(token, 'hashingToken')
        //console.log(decodedToken);
    }catch(err){
        err.statusCode=500;
        throw err;
    }
    if(!decodedToken){
        const error = new Error('Auth failed')
        error.statusCode=401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
}