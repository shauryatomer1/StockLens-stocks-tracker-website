import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
// import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: any }) => {
    // const initialStocks = await searchStocks();
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <Image src="/assets/icons/logo.svg" alt="StockLens logo" width={140} height={32} className="h-8 w-auto cursor-pointer"/>
        </Link>
        <nav className="hidden sm:block">
            {/* <NavItems initialStocks={initialStocks} /> */}
        </nav>
         <UserDropdown />
      </div>
    </header>
  );
};

export default Header;