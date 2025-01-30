$(document).ready(function () {

    let customers = [];
    let currentPage = 1;
    const customersPerPage = 10; // Number of customers per page
    const maxVisiblePages = 7;   // Maximum number of visible pagination links

    // Initial load of customers
    loadCustomers();

    function loadCustomers() {
        try {
            $.ajax({
                url: '/PacketOrder/GetCustomers',
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    customers = response.Customers;
                    displayCustomers();
                    renderPagination();
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

    function displayCustomers() {
        try {
            $('.customersContainer').empty();
            let startIndex = (currentPage - 1) * customersPerPage;
            let endIndex = startIndex + customersPerPage;

            let customerHTML = '';

            for (let i = startIndex; i < endIndex && i < customers.length; i++) {
                const customer = customers[i];
                customerHTML += `
                    <div class="customer">
                        <div class="customerActions">
                            <a href="/PacketOrder/UpdateCustomer/${customer.CustomerId}" class="edit">
                                <i class="fa fa-pencil" aria-hidden="true"></i>
                            </a>
                            <button class="delete" data-customer-id="${customer.CustomerId}">
                                <i class="fa fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="customerName">
                            <span> ${customer.NameSurname} </span>
                        </div>
                        <div class="customerPhone">
                            <span> ${customer.PhoneNumber} </span>
                        </div>
                        <div class="customerAdress">
                            <span>${customer.Adress}</span>
                        </div>
                    </div>
                `;
            }

            $('.customersContainer').append(customerHTML);
        }
        catch (e) {
            console.error(e);
        }

        
    }

    // Search input change handler
    $('input[name="findCustomer"]').on('input', function () {
        try {
            const searchText = $(this).val().trim().toLowerCase();

            // Filter customers based on searchText
            const filteredCustomers = customers.filter(customer =>
                customer.NameSurname.toLowerCase().includes(searchText) ||
                customer.PhoneNumber.toLowerCase().includes(searchText)
            );

            // Update displayed customers with filtered results
            displayFilteredCustomers(filteredCustomers);
            renderPagination(); // Update pagination for filtered results
        }
        catch (e) {
            console.error(e);
        }
       
    });

    function displayFilteredCustomers(filteredCustomers) {
        try {
            $('.customersContainer').empty();

            let customerHTML = '';

            filteredCustomers.forEach(customer => {
                customerHTML += `
                    <div class="customer">
                        <div class="customerActions">
                            <a href="/PacketOrder/UpdateCustomer/${customer.CustomerId}" class="edit">
                                <i class="fa fa-pencil" aria-hidden="true"></i>
                            </a>
                            <button class="delete" data-customer-id="${customer.CustomerId}">
                                <i class="fa fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="customerName">
                            <span> ${customer.NameSurname} </span>
                        </div>
                        <div class="customerPhone">
                            <span> ${customer.PhoneNumber} </span>
                        </div>
                        <div class="customerAdress">
                            <span>${customer.Adress}</span>
                        </div>
                    </div>
                `;
            });

            $('.customersContainer').append(customerHTML);
        }
        catch (e) {
            console.error(e);
        }

       
    }

    $('.customersContainer').on('click', '.customer .delete', function () {

        try {
            let customerId = $(this).data('customer-id');

            $.ajax({
                url: `/PacketOrder/DeleteCustomer/${customerId}`,
                type: 'PUT',
                processData: false,
                contentType: false,
                success: function (response) {
                    let indexToRemove = customers.findIndex(customer => customer.CustomerId === customerId);

                    if (indexToRemove !== -1) {
                        // Remove customer from array
                        customers.splice(indexToRemove, 1);

                        // Check if current page is affected by removal
                        if (indexToRemove >= (currentPage - 1) * customersPerPage && indexToRemove < currentPage * customersPerPage) {
                            displayCustomers(); // Update displayed customers on current page
                        } else {
                            renderPagination(); // Update pagination if current page isn't affected
                        }
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

    function renderPagination() {

        try {

            $('.pagination-list').empty();
            const totalPages = Math.ceil(customers.length / customersPerPage);

            let startPage, endPage;

            if (totalPages <= maxVisiblePages) {
                startPage = 1;
                endPage = totalPages;
            } else {
                const halfMaxVisiblePages = Math.floor(maxVisiblePages / 2);
                if (currentPage <= halfMaxVisiblePages) {
                    startPage = 1;
                    endPage = maxVisiblePages;
                } else if (currentPage + halfMaxVisiblePages >= totalPages) {
                    startPage = totalPages - maxVisiblePages + 1;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - halfMaxVisiblePages;
                    endPage = currentPage + halfMaxVisiblePages;
                }
            }

            let paginationHTML = '';

            // Previous button
            paginationHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                                <a class="page-link" href="#" aria-label="Previous" data-page="${currentPage - 1}">
                                    <span aria-hidden="true">&laquo;</span>
                                    <span class="visually-hidden">Previous</span>
                                </a>
                            </li>`;

            // Page buttons
            for (let i = startPage; i <= endPage; i++) {
                const liClass = (i === currentPage) ? 'active' : '';
                paginationHTML += `<li class="page-item ${liClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }

            // Next button
            paginationHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                                <a class="page-link" href="#" aria-label="Next" data-page="${currentPage + 1}">
                                    <span aria-hidden="true">&raquo;</span>
                                    <span class="visually-hidden">Next</span>
                                </a>
                            </li>`;

            $('.pagination-list').html(paginationHTML);
        }
        catch (e) {
            console.error(e);
        }

    }

    // Page link click handler
    $('.pagination-list').on('click', '.page-link', function (e) {
        try {
            e.preventDefault();
            const newPage = parseInt($(this).data('page'));

            if (currentPage !== newPage) {
                currentPage = newPage;
                displayCustomers();
                renderPagination();
            }
        }
        catch (e) {
            console.error(e);
        }
    });

});
