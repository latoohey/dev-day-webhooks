const axios = require('axios');
const almaUrl = 'https://api-na.hosted.exlibrisgroup.com';

const driveUrl = 'https://script.google.com/macros/s/AKfycbwSjYtVPEGQq0kZp9e3A-bAwmAT6xQTKhDjT1r5UkBqXnpiPjs/exec';

// use values from your instance of Alma
const circDesk = 'DEFAULT_CIRC_DESK';
const library = 'UNIV_LIB';

exports.handler = async body => {
    try {

        const request = body.user_request;
        
        if ((request.request_type === 'HOLD') && (request.request_sub_type.value === 'PATRON_PHYSICAL') && (request.request_status === 'IN_PROCESS' || request.request_status === 'ON_HOLD_SHELF')) {
            
            // get user
            const { data: user } = await axios.get(almaUrl + '/almaws/v1/users/' + request.user_primary_id, {
                params: {
                    format: 'json',
                    apikey: process.env.ALMA_API_KEY
                }
            });
            const {email_address: email} = user.contact_info.email.find(email => email.preferred);

            // share file in drive
            await axios.post(driveUrl, { barcode: request.barcode, user: email, action: 'add' });

            //loan item in Alma
            const { data: loan } = await axios.post(almaUrl + '/almaws/v1/users/' + request.user_primary_id + '/loans', { 
                circ_desk: {value: circDesk}, 
                library: {value: library} 
            }, {
                params: {
                    format: 'json',
                    apikey: process.env.ALMA_API_KEY,
                    item_barcode: request.barcode
                }
            });

            // schedule return of item
            const dueDate = new Date(loan.due_date);
            const now = new Date();
            const loanLength = dueDate - now;
            setTimeout(() => { 
                returnItem({ 
                    email: email,
                    barcode: request.barcode,
                    scanUrl: '/almaws/v1/bibs/' + loan.mms_id + '/holdings/' + loan.holding_id +'/items/' + loan.item_id 
                }) 
            }, loanLength);

        }
        
    } catch (error) {
        console.error(error);
    }
}

const returnItem = async ({ email, barcode, scanUrl }) => {
    try {
        await axios.post(driveUrl, { barcode: barcode, user: email, action: 'remove' });
        await axios.post(almaUrl + scanUrl, {}, {
            params: {
                library: library,
                circ_desk: circDesk,
                format: 'json',
                apikey: process.env.ALMA_API_KEY,
                op: 'scan'
            }
        })
    } catch (err) {
        console.error(err)
    }
}