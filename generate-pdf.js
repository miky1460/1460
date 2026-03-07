const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
const stream = fs.createWriteStream('login-details.pdf');
doc.pipe(stream);

// Colors
const primaryColor = '#1a1a2e';
const accentColor = '#e94560';
const lightBg = '#f4f4f4';

// Header background
doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

// Title
doc.fillColor('#ffffff')
   .font('Helvetica-Bold')
   .fontSize(26)
   .text('KANDZ HR PORTAL', 50, 30, { align: 'center' });

doc.fillColor('#cccccc')
   .font('Helvetica')
   .fontSize(13)
   .text('Login Credentials & Access Details', 50, 65, { align: 'center' });

doc.moveDown(3);

// Login URL section
doc.fillColor(accentColor)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('LOGIN URL', 50, 120);

doc.rect(50, 138, doc.page.width - 100, 35).fill('#e8f4fd');
doc.fillColor('#0066cc')
   .font('Helvetica')
   .fontSize(12)
   .text('https://1460-production.up.railway.app', 65, 149);

doc.moveDown(2);

// Note
doc.fillColor('#666666')
   .font('Helvetica-Oblique')
   .fontSize(10)
   .text('Note: If the URL above doesn\'t work, check your Railway dashboard for the exact deployment URL.', 50, 185, { width: doc.page.width - 100 });

// Divider
doc.moveTo(50, 210).lineTo(doc.page.width - 50, 210).strokeColor(accentColor).lineWidth(2).stroke();

doc.fillColor(accentColor)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('USER ACCOUNTS', 50, 225);

// Table header
const tableTop = 250;
const col1 = 50, col2 = 185, col3 = 330, col4 = 450;

doc.rect(50, tableTop, doc.page.width - 100, 25).fill(primaryColor);
doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
doc.text('Role', col1 + 5, tableTop + 8);
doc.text('Email', col2 + 5, tableTop + 8);
doc.text('Password', col3 + 5, tableTop + 8);
doc.text('Name', col4 + 5, tableTop + 8);

// Table rows
const users = [
  { role: 'Admin',        email: 'admin@kandz.io',   password: 'Admin@123',   name: 'Admin' },
  { role: 'CEO',          email: 'ceo@kandz.io',     password: 'CEO@1234',    name: 'Miky CEO' },
  { role: 'HR Manager',   email: 'carol@kandz.io',   password: 'HR@1234',     name: 'Carol Williams' },
  { role: 'Employee',     email: 'alice@kandz.io',   password: 'Alice@123',   name: 'Alice Johnson' },
  { role: 'Employee',     email: 'bob@kandz.io',     password: 'Bob@1234',    name: 'Bob Smith' },
  { role: 'Ops Manager',  email: 'omar@kandz.io',    password: 'Ops@1234',    name: 'Omar Sheikh' },
  { role: 'Team Lead',    email: 'tariq@kandz.io',   password: 'TL@1234',     name: 'Tariq Mahmood' },
  { role: 'Agent',        email: 'sara@kandz.io',    password: 'Sara@123',    name: 'Sara Khan' },
  { role: 'Agent',        email: 'usman@kandz.io',   password: 'Usman@123',   name: 'Usman Ali' },
  { role: 'Finance',      email: 'david@kandz.io',   password: 'Finance@123', name: 'David Brown' },
  { role: 'Employee',     email: 'fatima@kandz.io',  password: 'Fatima@123',  name: 'Fatima Raza' },
  { role: 'Office Mgr',   email: 'eve@kandz.io',     password: 'Office@123',  name: 'Eve Davis' },
];

users.forEach((u, i) => {
  const y = tableTop + 25 + (i * 25);
  const bg = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
  doc.rect(50, y, doc.page.width - 100, 25).fill(bg);

  doc.fillColor('#333333').font('Helvetica').fontSize(9);
  doc.text(u.role,     col1 + 5, y + 8, { width: 130 });
  doc.text(u.email,    col2 + 5, y + 8, { width: 140 });
  doc.text(u.password, col3 + 5, y + 8, { width: 115 });
  doc.text(u.name,     col4 + 5, y + 8, { width: 100 });
});

// Table border
const tableHeight = 25 + (users.length * 25);
doc.rect(50, tableTop, doc.page.width - 100, tableHeight).strokeColor('#cccccc').lineWidth(1).stroke();

// Footer
const footerY = tableTop + tableHeight + 30;
doc.rect(0, footerY, doc.page.width, 60).fill('#f4f4f4');
doc.fillColor('#999999').font('Helvetica').fontSize(9)
   .text('CONFIDENTIAL - For authorized personnel only. Do not share these credentials.', 50, footerY + 15, { align: 'center' })
   .text('Generated: ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 50, footerY + 32, { align: 'center' });

doc.end();
stream.on('finish', () => console.log('PDF created: login-details.pdf'));
