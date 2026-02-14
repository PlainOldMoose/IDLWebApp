import InfoCard from "../components/InfoCard.tsx";

export default function Landing() {
    const what_body = "This is a (non-vibecoded) web application make by Moose. It tracks and stores IDL data like " +
        "seasons and matches, and formats them into a more readable format.";
    const why_body = "The aim of this project is to replace the back-end currently used by the admins, thus ending Sabata's years of hard work manually entering data into a spreadsheets. " +
        "In the future it also seeks to provide features and tools to players of IDL, such as an in-house balancer and our very own doodle.";
    const how_body = "This project is made 100% by hand, using Java Springboot, React/Tailwind, and a PostgreSQL database. The project is open source, check out the source code and how to contribute";

    return (
        <div>
            <h1 className="text-9xl font-extrabold my-10">IDL Web Manager</h1>
            <div className="grid grid-cols-3 gap-4">
                <InfoCard title={"What?"} body={what_body}/>
                <InfoCard title={"Why?"} body={why_body}/>
                <InfoCard title={"How?"} body={
                    <>
                        {how_body + " "}
                        {<button className="font-extrabold underline hover:cursor-pointer" onClick={() => window.open(`https://github.com/PlainOldMoose/IDLWebApp`, "_blank")}>here </button>}
                    </>
                }/>
            </div>
        </div>
    );
}