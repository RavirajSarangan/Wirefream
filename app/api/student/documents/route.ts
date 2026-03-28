import { NextRequest, NextResponse } from 'next/server';
import { getStudentByEid } from '@/lib/student-queries';

export async function GET(req: NextRequest) {
    try {
        const eid = req.nextUrl.searchParams.get('eid');
        const docType = req.nextUrl.searchParams.get('type') || 'letter'; // letter, card, certificate

        if (!eid) {
            return NextResponse.json(
                { error: 'ESU Eid parameter required' },
                { status: 400 }
            );
        }

        // Get student details
        const student = await getStudentByEid(eid);
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        if (student.status !== 'approved') {
            return NextResponse.json(
                { error: 'Student access not approved' },
                { status: 403 }
            );
        }

        // Generate document content based on type
        let documentContent = '';
        let documentName = '';

        switch (docType) {
            case 'letter':
                documentContent = generateAccessLetter(student);
                documentName = `Access_Authorization_Letter_${eid}.txt`;
                break;
            case 'card':
                documentContent = generateAccessCard(student);
                documentName = `Student_Access_Card_${eid}.txt`;
                break;
            case 'certificate':
                documentContent = generateCertificate(student);
                documentName = `Access_Certificate_${eid}.txt`;
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid document type' },
                    { status: 400 }
                );
        }

        // Return document as text (in production, this would be PDF)
        return new NextResponse(documentContent, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${documentName}"`,
            },
        });

    } catch (error) {
        console.error('Error generating document:', error);
        return NextResponse.json(
            { error: 'Failed to generate document' },
            { status: 500 }
        );
    }
}

function generateAccessLetter(student: any): string {
    return `
ESU JAFFNA UNIVERSITY
Student Access Authorization Letter

═══════════════════════════════════════════════════════════

Date: ${new Date(student.approvalDate).toLocaleDateString()}
Reference: ESU-ACCESS-${student.eid}

TO WHOM IT MAY CONCERN:

This is to certify that:

Name: ${student.studentName}
ESU Student ID: ${student.eid}
Department: ${student.department || 'N/A'}
Academic Year: ${student.studentYear || 'N/A'}

Has been APPROVED for access to the following:
- Section ${student.section} Resources
- Study Materials and Lectures
- Course Information and Assignments

Authorization Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Approval Date: ${new Date(student.approvalDate).toLocaleDateString()}
Validity: ${365} days from approval date
Approved By: ${student.approvedBy}
Status: ACTIVE

Special Terms and Conditions:
• Access is valid for authorized university personnel only
• Resources must not be shared with unauthorized individuals
• Violations of this authorization will result in immediate revocation
• Student must follow all university policies and regulations

This authorization is issued by ESU Jaffna University and serves as official
documentation of approved access to university resources.

For verification or inquiries, please contact the Administration Office.

Authorized By:
ESU Jaffna University
Administration Office

═══════════════════════════════════════════════════════════
This is an official university document. Keep it safe and do not share
your ESU ID with unauthorized parties.
═══════════════════════════════════════════════════════════
`;
}

function generateAccessCard(student: any): string {
    return `
╔═══════════════════════════════════════════════════════╗
║      ESU JAFFNA UNIVERSITY STUDENT ACCESS CARD       ║
╚═══════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────┐
│  STUDENT RESOURCE ACCESS CARD                        │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Name: ${student.studentName.padEnd(45)}
│  ESU ID: ${student.eid.padEnd(40)}
│  Department: ${(student.department || 'N/A').padEnd(37)}
│  Section: ${('Section ' + (student.section || 'N/A')).padEnd(38)}
│  Year: ${(student.studentYear || 'N/A').padEnd(41)}
│                                                       │
├───────────────────────────────────────────────────────┤
│  APPROVAL INFORMATION                               │
├───────────────────────────────────────────────────────┤
│  Approved: ${new Date(student.approvalDate).toLocaleDateString()}
│  Valid Until: ${getValidityDate(student.approvalDate)}
│  Status: ACTIVE ✓                                    │
│                                                       │
├───────────────────────────────────────────────────────┤
│  AUTHORIZED RESOURCES                               │
├───────────────────────────────────────────────────────┤
│  ✓ Study Documents and Materials                    │
│  ✓ Video Lectures and Recordings                   │
│  ✓ Assignments and Coursework                       │
│  ✓ Course Information and Schedules                 │
│                                                       │
├───────────────────────────────────────────────────────┤
│  Reference: ${`ESU-ACCESS-${student.eid}`.padEnd(38)}
│  Issued by: ESU Administration                       │
└───────────────────────────────────────────────────────┘

IMPORTANT: This card must be treated as confidential.
Do not share your ESU ID with anyone unauthorized.
`;
}

function generateCertificate(student: any): string {
    return `
════════════════════════════════════════════════════════════════
                    CERTIFICATE OF APPROVAL
               For Resource Access Authorization
════════════════════════════════════════════════════════════════

                   ESU JAFFNA UNIVERSITY
                 Office of the Registrar

This certifies that:

████████████████████████████████████████████
${student.studentName.toUpperCase()}
████████████████████████████████████████████

BEARING THE UNIVERSITY ID: ${student.eid}

Has been formally APPROVED for:

                    ACCESS TO UNIVERSITY RESOURCES
                   FOR ACADEMIC YEAR ${new Date(student.approvalDate).getFullYear()}

Hereby authorized to access approved academic materials and resources
for their field of study in:

         DEPARTMENT: ${student.department || 'UNSPECIFIED'}
         SECTION: ${student.section || 'UNSPECIFIED'}
         ACADEMIC YEAR: ${student.studentYear || 'UNSPECIFIED'}

This approval is valid as of ${new Date(student.approvalDate).toLocaleDateString()}
and remains in effect for a period of 365 days unless otherwise revoked.

IN WITNESS WHEREOF, the Administration of ESU Jaffna University has
caused this certificate to be issued this day.

Approved By: ${student.approvedBy}
University Authority: ESU Administration Office
Date of Issue: ${new Date(student.approvalDate).toLocaleDateString()}

═══════════════════════════════════════════════════════════════════

REGULATIONS:
• This certificate is non-transferable
• Unauthorized use or sharing is prohibited
• Violations will result in immediate revocation of access
• For disputes or concerns, contact the Administration Office

═══════════════════════════════════════════════════════════════════
Document Reference: ${`CERT-${student.eid}-${new Date(student.approvalDate).getFullYear()}`}
════════════════════════════════════════════════════════════════════
`;
}

function getValidityDate(approvalDate: string): string {
    const date = new Date(approvalDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toLocaleDateString();
}
