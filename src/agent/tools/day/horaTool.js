
import axios from "axios";
import { getProkeralaToken } from "./prokeralaAuth.js";



function convertToToday(dateString, today) {

    const source =
        new Date(dateString);


    const result =
        new Date(today);


    result.setHours(
        source.getUTCHours(),
        source.getUTCMinutes(),
        source.getUTCSeconds(),
        0
    );


    return result;

}




function findCurrentHora(horaData, now) {

    const allHoras = [];


    function scan(obj) {

        if (!obj || typeof obj !== "object") {
            return;
        }


        if (
            obj.start &&
            obj.end &&
            obj.hora &&
            obj.hora.name
        ) {

            allHoras.push(obj);

        }


        Object.values(obj)
            .forEach(scan);

    }


    scan(horaData);



    console.log(
        "FOUND HORAS:",
        allHoras.length
    );



    for (const hora of allHoras) {


        const start =
            convertToToday(
                hora.start,
                now
            );


        const end =
            convertToToday(
                hora.end,
                now
            );



        if (end < start) {

            end.setDate(
                end.getDate() + 1
            );

        }



        console.log(
            "CHECK HORA:",
            hora.hora.name,
            start.toLocaleTimeString(),
            end.toLocaleTimeString(),
            now.toLocaleTimeString()
        );



        if (
            now >= start &&
            now <= end
        ) {


            console.log(
                "MATCH FOUND:",
                hora.hora.name
            );



            return {

                planet:
                    hora.hora.name,

                vedicName:
                    hora.hora.vedic_name,

                type:
                    hora.type,

                isDay:
                    hora.is_day,

                start,

                end

            };

        }

    }



    return null;

}




export async function getHora({

    latitude,

    longitude,

    language = "en"

}) {


    try {


        const token =
            await getProkeralaToken();




        const current =
            new Date();




        // Prokerala sandbox supports January 1
        const sandboxDate =
            new Date(

                current.getFullYear(),

                0,

                1,

                current.getHours(),

                current.getMinutes(),

                current.getSeconds()

            );





        const response =
            await axios.get(

                "https://api.prokerala.com/v2/astrology/hora",

                {

                    headers: {

                        Authorization:
                            "Bearer " + token

                    },


                    params: {


                        ayanamsa: 1,


                        coordinates:
                            `${latitude},${longitude}`,


                        datetime:
                            sandboxDate
                                .toISOString()
                                .replace(
                                    ".000Z",
                                    "+05:30"
                                ),


                        la: language

                    },


                    timeout:15000

                }

            );





        // Explicit IST current time
        const indiaNow =
            new Date(

                new Date()
                    .toLocaleString(
                        "en-US",
                        {
                            timeZone:
                                "Asia/Kolkata"
                        }
                    )

            );




        console.log(

            "INDIA CURRENT TIME:",

            indiaNow.toLocaleString(
                "en-IN",
                {
                    timeZone:
                        "Asia/Kolkata"
                }
            )

        );





        const currentHora =
            findCurrentHora(

                response.data,

                indiaNow

            );





        return {


            success:true,


            data:{


                currentTime:
                    indiaNow,


                currentHora


            }


        };



    } catch(error) {


        return {


            success:false,


            error:
                error.response?.data ||
                error.message


        };

    }

}




export default {


    name:"horaTool",


    description:
        "Get current planetary hora based on user location.",


    terminal:true,


    invoke:getHora

};

