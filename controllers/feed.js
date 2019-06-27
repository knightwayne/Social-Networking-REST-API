const fs=require('fs');

const io = require('../socket');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req,res,next)=>{
    Post.find()
    .then(posts=>{
        //console.log(posts);
        res.status(200).json({
            message: 'Posts fetched',
            posts: posts
        })
    })
    .catch(err=>{
        console.log(err);
        err.statusCode=500;
        next(err);
    }) 
}

exports.postPost = (req,res,next)=>{
    //console.log(req.file);
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path;
    let creator;
    if(!req.file){
        const error = new Error('No image provided.');
        error.statusCode=422;
        throw error;
    }
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId /*{name: 'knightwayne'}*/
    });
    post.save()
    .then(result=>{
        return User.findById(req.userId)
    })
    .then(user=>{
        creator=user;
        user.posts.push(post._id);      //user.posts.push(post) --- correct too, mongoose will extract _id from it
        return user.save();
    })
    .then(result=>{
        //console.log(resultPost);
        io.getIO().emit('posts', {action: 'create', post: post});
        res.status(201).json({
            message: 'New Post Created!',
            post: post,
            creator: {name: creator.name, _id: creator._id}
        });
    })
    .catch(err=>{
        console.log(err);
        err.statusCode=500;
        err.message = 'Server Side Error. Working on it!'
        next(err);
    })
}

exports.getPost = (req,res,next)=>{
    const postId = req.params.postId;
    //console.log(postId);
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error = new Error('Cant find post');
            error.statusCode=404;
            throw error;    //reach next catch block, next -> exit and go to error middleware
        }
        res.status(200).json({
            message: 'Post fetched',
            post: post
        });
    }
    )
    .catch(err=>{
        console.log(err);
        err.statusCode=500;
        next(err);
    })
};

exports.updatePost = (req,res,next)=>{
    const postId = req.params.postId;
    //console.log('backend', postId);
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;      //let not const; that is why image not updating; 2 hours of debugging [|;-{]
    console.log(req);
    console.log(req.file);
    if(req.file){
        imageUrl=req.file.path;
        console.log('file change');
    }
    if(!imageUrl){
        const error = new Error('No image provided.');
        error.statusCode=422;
        throw error;
    }
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error = new Error('Cant find post');
            error.statusCode=404;
            throw error;    //reach next catch block, next -> exit and go to error middleware
        }
        if(post.creator.toString()!==req.userId){
            const error = new Error('Not authorized');
            error.statusCode=403;
            throw error;
        }
        post.title=title;
        post.content=content;
        post.imageUrl=imageUrl;
        return post.save();
    })
    .then(resultPost=>{
        io.getIO().emit('posts', {action: 'update', post: resultPost})
        res.status(200).json({
            message: 'Post updated',
            post: resultPost
        });
    })
    .catch(err=>{
        console.log(err);
        err.statusCode=500;
        next(err);
    })

};

exports.deletePost = (req,res,next)=>{
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error = new Error('Cant find post');
            error.statusCode=404;
            throw error;    //reach next catch block, next -> exit and go to error middleware
        }
        if(post.creator.toString()!==req.userId){
            const error = new Error('Not authorized');
            error.statusCode=403;
            throw error;
        }
        return Post.findByIdAndRemove(postId)
    })
    .then(result=>{
        return User.findById(req.userId)
    })
    .then(user=>{
        user.posts.pull(postId);
        return user.save();
    })
    .then(result=>{
        io.getIO().emit('posts', {action: 'delete', post: postId})
        res.status(200).json({
            message: 'Post deleted!'
        })
    })
    .catch(err=>{
        console.log(err);
        err.statusCode=500;
        next(err);
    })

}