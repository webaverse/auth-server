// @ts-check
const AWS = require('aws-sdk');
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsConfig = new AWS.Config({
    credentials: new AWS.Credentials({
        accessKeyId,
        secretAccessKey,
    }),
    region: 'us-west-1',
});

const ddb = new AWS.DynamoDB({
    ...awsConfig,
    apiVersion: '2012-08-10',
});

const ddbd = new AWS.DynamoDB.DocumentClient({
    ...awsConfig,
    apiVersion: '2012-08-10',
});

async function getDynamoItem(email, TableName) {
    const params = {
        TableName,
        Key: {
            email,
        },
    };

    try {
        return await ddbd.get(params).promise();
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function putDynamoItem(email, data, TableName) {
    const params = {
        TableName,
        Item: {
            ...data,
            email,
        },
    };

    try {
        return ddbd.put(params).promise();
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function getDynamoAllItems(TableName) {
    const params = {
        TableName,
    };

    try {
        const o = await ddbd.scan(params).promise();
        const items = (o && o.Items) || [];
        return items;
    } catch (e) {
        console.error(e);
        return null;
    }
}


module.exports = {
    ddb,
    ddbd,
    getDynamoItem,
    putDynamoItem,
    getDynamoAllItems,
}