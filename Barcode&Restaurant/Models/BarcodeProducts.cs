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
    
    public partial class BarcodeProducts
    {
        public int ProductId { get; set; }
        public int UserId { get; set; }
        public string Barcode { get; set; }
        public string Name { get; set; }
        public string Price { get; set; }
        public int isActive { get; set; }
    
        public virtual Users Users { get; set; }
    }
}
