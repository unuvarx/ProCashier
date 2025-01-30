using Barcode_Restaurant.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Barcode_Restaurant.Controllers
{
    public class HomeController : Controller
    {
        private readonly BarcodeRestoEntities _context;
        public HomeController()
        {
            _context = new BarcodeRestoEntities();
        }
        public ActionResult Index()
        {
            var myCustomers = _context.MyCustomers.ToList();
            return View(myCustomers);
        }


        public ActionResult Page404()
        {
            Response.StatusCode = 404;
            Response.TrySkipIisCustomErrors = true;
            return View();
        }
        public ActionResult Kvkk() {

            return View();
        }
       

    }
}