using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;

namespace FileTest
{
    class Program
    {
        static void Main(string[] args)
        {
            bool isEx = File.Exists("c:/hehe.txt");

            Console.Write(isEx);
            Console.ReadKey();
        }
    }
}
