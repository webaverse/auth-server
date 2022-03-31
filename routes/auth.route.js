// @ts-check
const router = require('express').Router();
const ethers = require('ethers');
const crypto = require('crypto');
const dynamoDB = require('../utils/aws');
const { generateMnemonic } = require('bip39');
const NonceModel = require('../models/nonce');
const jwt = require('jsonwebtoken');


const signingMessage = "Welcome to Webaverse!\nClick to sign in and accept the Webaverse Terms of Service.\nThis request will not trigger a blockchain transaction or cost any gas fees.";


router.get('/metamask-login', async (req, res) => {
    let { address } = req.query;
    if (!ethers.utils.isAddress(`${address}`)) {
        return res.status(400).json({
            message: 'Invalid Address'
        });
    }

    address = `${address}`.toLowerCase();


    const nonce = crypto.randomBytes(64).toString('hex');
    try {
        await NonceModel.updateOne({
            address
        }, {
            nonce,
            validTill: Date.now() + 2 * 60 * 1000 // 2 minutes
        }, {
            upsert: true
        });

        const message = signingMessage + "\nWallet address:\n" + address + "\nNonce:\n" + nonce;

        res.status(200).json({
            message
        });
    } catch (error) {
        res.status(500).json({
            message: 'Something went wrong'
        });
    }
});

router.post('/metamask-login', async (req, res) => {
    let { address, signedMessage } = req.body;
    if (!ethers.utils.isAddress(`${address}`)) {
        return res.status(400).json({
            message: 'Invalid Address'
        });
    }

    address = `${address}`.toLowerCase();

    if (!signedMessage) {
        return res.status(400).json({
            message: 'Authentication failed',
        });
    }
    try {
        const nonceObj = await NonceModel.findOne({ address });
        if (!nonceObj || new Date(nonceObj.validTill) < new Date()) {
            await NonceModel.remove({ address });
            return res.status(400).json({
                message: 'Signed message expired.',
            });
        }

        const nonce = nonceObj.nonce;
        const message = signingMessage + "\nWallet address:\n" + address + "\nNonce:\n" + nonce;

        const signerAddress = ethers.utils.verifyMessage(message, signedMessage);

        if (signerAddress.trim().toLowerCase() !== address) {
            return res.status(400).json({
                message: 'Signer address is different from current address',
            });
        }
        const dbobj = await dynamoDB.getDynamoItem(`${address}.metamask`, 'users')
        let mnemonic = dbobj.Item?.mnemonic;
        if (!mnemonic) {
            const mnemonic = generateMnemonic();
            await dynamoDB.putDynamoItem(`${address}.metamask`, { mnemonic }, 'users');
        }

        const jwtToken = jwt.sign({ address }, process.env.JWT_TOKEN_SECRET, {
            expiresIn: '1d'
        });

        return res.json({
            jwtToken
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: 'Authentication failed',
        });
    }
});

router.get('/mnemonic', async (req, res) => {
    const jwtToken = `${req.headers.authorization}`.replace('Bearer ', '').replace('bearer ', '');
    try {
        const { address } = jwt.verify(jwtToken, process.env.JWT_TOKEN_SECRET);
        const dbobj = await dynamoDB.getDynamoItem(`${address}.metamask`, 'users')
        let mnemonic = dbobj.Item?.mnemonic;
        return res.status(401).json({
            mnemonic
        });
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid JWT Token'
        });
    }
});

module.exports = router;