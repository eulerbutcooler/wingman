import Hero from "./hero/page"

export default function Home() {
  return (
    <div>
      {/* <div className='bg-[#f5f5f5] px-8 text-center flex lg:hidden h-[100vh] w-[100vw] justify-center items-center z-50'>Not available for mobile yet, please use wingman on desktop</div> */}
      <div className='bg-[#f5f5f5]'><Hero/></div>
    </div>
  )
}
