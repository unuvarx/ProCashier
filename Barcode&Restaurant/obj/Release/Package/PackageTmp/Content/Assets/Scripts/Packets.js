$(document).ready(function () {

    // Listen to changes in barcode package start and end time selects
    $("#barcodeStartSelect, #barcodeEndSelect").change(function () {
        try {
            $("#barcodeUpdateButton").css("visibility", "visible");
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Listen to changes in resto package start and end time selects
    $("#restoStartSelect, #restoEndSelect").change(function () {
        try {
            $("#restoUpdateButton").css("visibility", "visible");
        }
        catch (e) {
            console.error(e);
        }
        
    });

    // Handle click event for barcode update button
    $('#barcodeUpdateButton').on('click', function () {
        try {
            if (confirm("Barcode saati güncellensin mi?")) {
                var barcodeStartTime = $("#barcodeStartSelect").val();
                var barcodeEndTime = $("#barcodeEndSelect").val();
                var packetType = 0;
                var packetId = $(this).data('barcode-id');

                let formData = new FormData();
                formData.append('packetId', packetId);
                formData.append('packetType', packetType);
                formData.append('startTime', barcodeStartTime);
                formData.append('endTime', barcodeEndTime);

                $.ajax({
                    url: `/User/ChangePacketTime`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        window.location.href = "/User/Packets";
                    },
                    error: function (xhr, status, error) {

                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }
        
        // Here you can perform further actions with the selected times
    });

    // Handle click event for resto update button
    $('#restoUpdateButton').on('click', function () {
        try {
            if (confirm("Adisyon saati güncellensin mi?")) {
                var restoStartTime = $("#restoStartSelect").val();
                var restoEndTime = $("#restoEndSelect").val();
                var packetId = $(this).data('resto-id');
                var packetType = 1;
                let formData = new FormData();
                formData.append('packetId', packetId);
                formData.append('packetType', packetType);
                formData.append('startTime', restoStartTime);
                formData.append('endTime', restoEndTime);

                $.ajax({
                    url: `/User/ChangePacketTime`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        window.location.href = "/User/Packets";

                    },
                    error: function (xhr, status, error) {
                        console.error(errror);
                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }
        

        // Here you can perform further actions with the selected times
    });
});
