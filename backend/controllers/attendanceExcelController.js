const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const ATTENDANCE_DIR = path.join(__dirname, '..', 'attendance');
if (!fs.existsSync(ATTENDANCE_DIR)) {
    fs.mkdirSync(ATTENDANCE_DIR, { recursive: true });
}

/**
 * Ensure an Excel workbook exists for today, return workbook & worksheet.
 */
async function getTodaySheet() {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filePath = path.join(ATTENDANCE_DIR, `attendance_${todayStr}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
    }
    let worksheet = workbook.getWorksheet('Attendance');
    if (!worksheet) {
        worksheet = workbook.addWorksheet('Attendance');
        worksheet.columns = [
            { header: 'Student ID', key: 'studentId', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Timestamp', key: 'timestamp', width: 24 }
        ];
    }
    // if worksheet loaded but has no columns definitions (possible older file)
    if (!worksheet.columns || worksheet.columns.length === 0) {
        worksheet.columns = [
            { header: 'Student ID', key: 'studentId', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Timestamp', key: 'timestamp', width: 24 }
        ];
    }
    return { workbook, worksheet, filePath };
}

exports.markAttendance = async (req, res) => {
    try {
        const { label } = req.body; // label = "FirstName Something" or similar
        if (!label) return res.status(400).json({ error: 'Label required' });

        let studentId = '';
        let name = label;
        const parts = label.trim().split(/\s+/);
        const last = parts[parts.length - 1];
        if (/^\d+$/.test(last)) {
            studentId = last;
            name = parts.slice(0, -1).join(' ');
        }
        const { workbook, worksheet, filePath } = await getTodaySheet();

        // Check if already recorded
        let already = false;
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const sid = row.getCell(1).value;
            const nm = row.getCell(2).value;
            if ((studentId && sid === studentId) || nm === name) {
                already = true;
            }
        });
        if (already) return res.json({ message: 'Already recorded' });

        worksheet.addRow({ studentId, name, timestamp: new Date().toLocaleString() });
        await workbook.xlsx.writeFile(filePath);
        res.json({ message: 'Recorded' });
    } catch (err) {
        console.error('Attendance record error:', err);
        res.status(500).json({ error: err.message });
    }
};
