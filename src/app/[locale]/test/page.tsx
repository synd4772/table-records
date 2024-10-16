'use client'

import { useState } from "react"

export default function Home() {
    let aaa = []
    const [aa, setAa] = useState(aaa)
    const add = () => {
        console.log(123)
      
        
    }
    for (let i = 0; i <= 100; i++){
        aaa.push(<tr key={i} onClick={i == 50 ? add : () => {}} style={{border:"1px black solid", borderCollapse:"collapse", backgroundColor:i == 50 ? "red" : "white"}}>
            <td style={{border:"1px black solid", borderCollapse:"collapse"}}>
                hell
            </td>
            <td style={{border:"1px black solid", borderCollapse:"collapse"}}>
                tf
            </td>
            <td style={{border:"1px black solid", borderCollapse:"collapse"}}>
                pass
            </td>
        </tr>
        )

    }


  return (
    <div className={'table-container'}>
      <table className='documents-table' style={{border:"1px black solid", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{border:"1px black solid", borderCollapse:"collapse"}}>
            <td style={{border:"1px black solid", borderCollapse:"collapse"}}>
                hell
            </td>
            <td style={{border:"1px black solid", borderCollapse:"collapse"}}>
                tf
            </td>
            <td style={{border:"1px black solid", borderCollapse:"collapse"}}>
                pass
            </td>
          </tr>
        </thead>
        <tbody>
         {aa}
        </tbody>
      </table>
    </div>
  );
}
