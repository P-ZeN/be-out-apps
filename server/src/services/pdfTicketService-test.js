import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import pool from '../db.js';

console.log('All imports successful');

class PDFTicketService {
    constructor() {
        console.log('Constructor called');
        this.browser = null;
        this.uploadDir = path.join(process.cwd(), 'uploads', 'tickets');
        console.log('Constructor completed');
    }
}

console.log('Class defined');

const instance = new PDFTicketService();
console.log('Instance created');

export default instance;
