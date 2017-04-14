using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebApplication2.Controllers
{
    public class HomeController : Controller
    {
        public int Index()
        {
            ViewBag.Title = "Home Page";

            return Test.Fibo(35);
        }
    }

    public static class Test
    {
        public static int Fibo(int n)
        {
            return n > 1 ? Fibo(n - 1) + Fibo(n - 2) : 1;
        }
    }
}
