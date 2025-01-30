$(document).ready(function () {
    var id = $("#historyId").val();
   
    try {
        $.ajax({
            url: `/Barcode/GetSalesHistoryById/${id}`,
            type: 'GET',
            dataType: 'json',
            success: function (response) {

                let products = JSON.parse(response.Products);
                // Tabloyu temizle
                $('#tableBody').empty();


                // Her ürün için tabloya bir satır ekle
                products.forEach(function (product) {
                    var row =
                        '<tr>' +

                        '<td>' + product.Barcode + '</td>' +
                        '<td>' + product.Name + '</td>' +
                        '<td>' + product.Amount + '</td>' +
                        '<td>' + parseFloat(product.NewPrice).toFixed(2) + 'TL</td>' +
                        '<td>' + parseFloat(product.Cost).toFixed(2) + 'TL</td>' +

                        '</tr>';
                    $('.tableBody').append(row);
                });
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
