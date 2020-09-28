const axios = require('axios');
const almaUrl = 'https://api-na.hosted.exlibrisgroup.com';

const driveUrl = 'https://script.google.com/macros/s/AKfycbwSjYtVPEGQq0kZp9e3A-bAwmAT6xQTKhDjT1r5UkBqXnpiPjs/exec';

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

        }
        
    } catch (error) {
        console.error(error);
    }
}
