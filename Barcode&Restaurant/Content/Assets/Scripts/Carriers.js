$(document).ready(function () {

    let carriers = [];

 
    loadCarriers();
    
    function loadCarriers() {
        try {
            $.ajax({
                url: '/Carriers/GetCarriers',
                type: 'GET',
                dataType: 'json',
                success: function (response) {

                    carriers = response;

                    displayCarriers();
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
    }

    function displayCarriers() {
        try {
            $('.customersContainer').empty();

            let carrierHTML = '';
            carriers.forEach(carrier => {

                carrierHTML += `
                    <div class="customer">
                        <div class="customerActions">
                            <a href="/Carriers/UpdateCarrier/${carrier.CarrierId}" class="edit">
                                <i class="fa fa-pencil" aria-hidden="true"></i>
                            </a>
                            <button class="delete" data-customer-id="${carrier.CarrierId}">
                                <i class="fa fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="customerName">
                            <span> ${carrier.NameSurname} </span>
                        </div>
                        <div class="customerPhone">
                            <span> ${carrier.Username} </span>
                        </div>
                        <div class="customerAdress">
                            <span>${carrier.Password}</span>
                        </div>
                    </div>
                `;

            })



            $('.customersContainer').append(carrierHTML);
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Search input change handler
    

    $('.customersContainer').on('click', '.customer .delete', function () {
        try {
            let carrierId = $(this).data('customer-id');

            $.ajax({
                url: `/Carriers/DeleteCarrier/${carrierId}`,
                type: 'PUT',
                processData: false,
                contentType: false,
                success: function (response) {
                    let indexToRemove = carriers.findIndex(carrier => carrier.CarrierId === carrierId);

                    if (indexToRemove !== -1) {
                        // Remove customer from array
                        carriers.splice(indexToRemove, 1);
                        displayCarriers();
                    }
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
});
