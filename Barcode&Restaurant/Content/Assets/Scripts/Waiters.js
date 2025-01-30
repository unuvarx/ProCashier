$(document).ready(function () {

    let waiters = [];


    loadWaiters();

    function loadWaiters() {
        try {
            $.ajax({
                url: '/Waiters/GetWaiters',
                type: 'GET',
                dataType: 'json',
                success: function (response) {

                    waiters = response;

                    displayWaiters();
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

    function displayWaiters() {
        try {
            $('.customersContainer').empty();

            let waiterHTML = '';
            waiters.forEach(waiter => {
                waiterHTML += `
                    <div class="customer">
                        <div class="customerActions">
                            <a href="/Waiters/UpdateWaiter/${waiter.WaiterId}" class="edit">
                                <i class="fa fa-pencil" aria-hidden="true"></i>
                            </a>
                            <button class="delete" data-customer-id="${waiter.WaiterId}">
                                <i class="fa fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="customerName">
                            <span> ${waiter.NameSurname} </span>
                        </div>
                        <div class="customerPhone">
                            <span> ${waiter.Username} </span>
                        </div>
                        <div class="customerAdress">
                            <span>${waiter.Password}</span>
                        </div>
                    </div>
                `;

            })



            $('.customersContainer').append(waiterHTML);
        }
        catch (e) {
            console.error(e);
        }
        
    }

    // Search input change handler


    $('.customersContainer').on('click', '.customer .delete', function () {
        try {
            let waiterId = $(this).data('customer-id');

            $.ajax({
                url: `/Waiters/DeleteWaiter/${waiterId}`,
                type: 'PUT',
                processData: false,
                contentType: false,
                success: function (response) {
                    let indexToRemove = waiters.findIndex(waiter => waiter.WaiterId === waiterId);

                    if (indexToRemove !== -1) {
                        // Remove customer from array
                        waiters.splice(indexToRemove, 1);
                        displayWaiters();
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
