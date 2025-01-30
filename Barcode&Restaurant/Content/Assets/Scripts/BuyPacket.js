$(document).ready(function () {
    try {

        $.ajax({
            url: '/User/GetPacketInformations',
            type: 'GET',
            dataType: 'json',
            success: function (response) {


                $('select[name="infoId"]').empty(); // Fazladan " karakterini kaldırdık

                let option = ``;
                response.forEach(element => {
                    option += `<option value="${element.InfoId}"> ${element.PacketName} ${element.PacketType === 0 ? "Barkod" : "Adisyon"} Programı ${element.PacketPrice}TL</option>`;
                });
                $('select[name="infoId"]').append(option);

            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    }
    catch (e) {
        console.error(e);
    }

});
