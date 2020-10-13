function doPost(e) {
    let found = false;
    const body = JSON.parse(e.postData.contents);
    const {barcode, user, action} = body;
    let resBody;
    try {
        if (barcode && user && action) {
            const files = DriveApp.getFiles();
            while (files.hasNext()) {
                const file = files.next();
                const name = file.getName();
                if (name == barcode + '.pdf') {
                  if (action === 'add') {
                    file.addViewer(user);
                  } else {
                    file.removeViewer(user)
                  }
                    found = true;
                    break;
                }
            }
        }
        resBody = JSON.stringify({
            found: found
        });
    } catch (err) {
        resBody = JSON.stringify({
            err: err
        });
    }
    const response = ContentService.createTextOutput(resBody);
    response.setMimeType(ContentService.MimeType.JSON);
    return response;
}
