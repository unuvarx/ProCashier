﻿//------------------------------------------------------------------------------
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
    using System.Data.Entity;
    using System.Data.Entity.Infrastructure;
    
    public partial class BarcodeRestoEntities : DbContext
    {
        public BarcodeRestoEntities()
            : base("name=BarcodeRestoEntities")
        {
        }
    
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            throw new UnintentionalCodeFirstException();
        }
    
        public virtual DbSet<Admins> Admins { get; set; }
        public virtual DbSet<BarcodeProducts> BarcodeProducts { get; set; }
        public virtual DbSet<BoughtPacket> BoughtPacket { get; set; }
        public virtual DbSet<Carriers> Carriers { get; set; }
        public virtual DbSet<Customers> Customers { get; set; }
        public virtual DbSet<MenuCategories> MenuCategories { get; set; }
        public virtual DbSet<MenuProducts> MenuProducts { get; set; }
        public virtual DbSet<MyCustomers> MyCustomers { get; set; }
        public virtual DbSet<Notifications> Notifications { get; set; }
        public virtual DbSet<PacketInformations> PacketInformations { get; set; }
        public virtual DbSet<PacketOrders> PacketOrders { get; set; }
        public virtual DbSet<Packets> Packets { get; set; }
        public virtual DbSet<SalesHistory> SalesHistory { get; set; }
        public virtual DbSet<TableCategories> TableCategories { get; set; }
        public virtual DbSet<Tables> Tables { get; set; }
        public virtual DbSet<TableSalesHistory> TableSalesHistory { get; set; }
        public virtual DbSet<Users> Users { get; set; }
        public virtual DbSet<Waiters> Waiters { get; set; }
    }
}
