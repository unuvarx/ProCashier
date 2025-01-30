$(document).ready(function () {

    $('tbody').on('click', '#checkBtn', function () {

        try {
            // Find the note input within the same row
            let note = $(this).closest('tr').find('.checkInput input[name="note"]').val();
            let userId = $(this).attr('data-user-id');
            let boughtPacketId = $(this).attr('data-bought-packet-id');
            let packetType = parseInt($(this).attr('data-packet-type'));

            let formData = new FormData();
            formData.append('type', packetType);
            formData.append('boughtPacketId', boughtPacketId);
            formData.append('userId', userId);
            formData.append('note', note);

            if (confirm('Bu kullanıcıya 1 yıl eklemek istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/CheckPayment`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        window.location.reload();
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }

        
    });

    $('tbody').on('click', '#rejectBtn', function () {
        try {

            // Find the note input within the same row
            let note = $(this).closest('tr').find('.rejectInput input[name="note"]').val();
            let userId = $(this).attr('data-user-id');
            let boughtPacketId = $(this).attr('data-bought-packet-id');
            let packetType = $(this).attr('data-packet-type');

            let formData = new FormData();
            formData.append('type', packetType);
            formData.append('boughtPacketId', boughtPacketId);
            formData.append('userId', userId);
            formData.append('note', note);

            if (confirm('Bu kullanıcının satın alma isteğini iptal etmek istediğinize emin misiniz?')) {
                $.ajax({
                    url: `/Admin/RejectPayment`,
                    type: 'PUT',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        window.location.reload();
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
            }
        }
        catch (e) {
            console.error(e);
        }

    });

});
