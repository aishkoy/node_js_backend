import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { getKnex } from './knex.js';
import Knex from "knex";

const router = new Router();

router.post('/login', async (ctx) => {
    const knex = await Knex(ctx);
    const {nickname, password} = ctx.request.body;

    if(!nickname || !password) {
        ctx.status = 404;
        ctx.body = {
            error: 'Nickname and password are required'
        };
        return;
    }

    const user = await knex('users')
        .where({ nickname })
        .first()

    if(!user) {
        ctx.status = 404;
        ctx.body = {
            error: 'User not found'
        };
        return;
    }

    if(password === user.password){
        ctx.status = 200;
        ctx.body = {message: "Login successfully", user};
    } else{
        ctx.status = 400;
        ctx.body = {message: "Invalid Password"};
    }

})

router.post('/register', async (ctx) => {
    const knex = await getKnex();
    const {nickname, fullName, password} = ctx.request.body;

    if(!nickname || !fullName || !password) {
        ctx.status = 400;
        ctx.body = {error : 'Nickname, full name, and password are required'};
        return;
    }

    const existingUser = await knex('users')
        .where({nickname}).first()

    if(existingUser) {
        ctx.status = 400;
        ctx.body = {error : 'User already registered'};
        return;
    }

    const registration_date = new Date().getDate().split('T')[0];
    const [user] = await knex('users')
        .insert({nickname, fullName, registration_date, password})
        .returning('*');

    ctx.status = 201;
    ctx.body = { message: 'User registered successfully', user };
})

router.get('/user/:id', async (ctx) => {
    const knex = await getKnex();
    const user = knex('users')
        .select('id', 'nickname', 'fullname', 'password')
        .where({id : ctx.params.id})
        .first();

    if(!user){
        ctx.status = 404;
        ctx.body = {error : 'User not found'};
        return;
    }

    ctx.status = 200;
    ctx.body = user
})


router.post('/posts', async (ctx) => {
    const knex = await getKnex();
    const {user_id, text} =  ctx.request.body;

    if(!user_id || !text) {
        ctx.status = 404;
        ctx.body = {error: 'user_id and text are required'};
        return;
    }

    const user = await knex('users')
        .where({id: user_id})
        .first();

    if (!user){
        ctx.status = 400;
        ctx.body = {error : 'User not found'};
        return;
    }

    const [post] = await knex('posts')
        .insert({user_id, text})
        .returning('*')

    ctx.status = 200;
    ctx.body = {message: 'Post created successfully', post}
})

router.get('/user/:id/posts', async (ctx) => {
    const knex = await getKnex();
    const user = await knex('users')
        .where({id: ctx.params.id})
        .first();

    if (!user) {
        ctx.status = 404;
        ctx.body = {error: 'User not found'};
        return;
    }

    const posts = await knex('posts')
        .select('*')
        .where({user_id: user.id})

    ctx.status = 200;
    ctx.body = {user_id: user.id, posts }
})

router.get('/', async (ctx) => {
    ctx.status = 200;
    ctx.body = {page = 'You are in Main page'};
})

router.get('/post/:id', async (ctx) => {
    const knex = await getKnex();
    const post = await knex('posts').
        where({id: ctx.params.id})
        .first();

    ctx.body = {post};
    ctx.status = 200;
})

router.get('/users', async (ctx) => {
    ctx.body = {ok : true};
    ctx.status = 202;
})

router.post('/users', async (ctx) => {
    console.log('post request to /users', ctx.request.body);

    ctx.body = ctx.request.body;
    ctx.status = 201;
});

async function main() {
    console.log('start', new Date());
    const knex = await getKnex();
    const res = await knex.raw('select 1 + 1 as sum');
    const app = new Koa();

    app.use(bodyParser());
    app.listen(8080);
    app.use(router.routes());
    app.use(async (ctx) => {
        ctx.body = {
            hello: 'world',
        };

        ctx.status = 200;
    });

    const HTTP_PORT = 8080 + Math.round(Math.random() * 10);
    console.log(res.rows);
    app.listen(HTTP_PORT, ()=>
    {
        console.log('server started on port', HTTP_PORT);
    });
}

main().catch((e) => {
    console.log(e);
    process.exit(1);
});
