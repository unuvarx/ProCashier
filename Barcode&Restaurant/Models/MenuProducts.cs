//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Barcode_Restaurant.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class MenuProducts
    {
        public int ProductId { get; set; }
        public int CategoryId { get; set; }
        public int UserId { get; set; }
        public string ProductName { get; set; }
        public string ProductPrice { get; set; }
        public int Status { get; set; }
    
        public virtual MenuCategories MenuCategories { get; set; }
        public virtual Users Users { get; set; }
    }
}
