import { AspectRatio } from "@/components/ui/aspect-ratio";
import pb from "@/lib/pocketbase";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import BackButton from "./back";
import RawManga from "@/types/manga";
import { sanitize } from "isomorphic-dompurify";

export default async function MangaSingleton({ params }: { params: { id: string } }) {
    const manga = await pb.collection("manga").getOne<RawManga>(params.id, { expand: "authors,actors,genres" }).catch((err) =>
        console.error(err)
    );

    if (!manga) {
        notFound();
    }

    const rawCharacters = await pb.collection("manga_characters").getFullList({ filter: `manga ~ '${params.id}'`, expand: "character" }).catch((err) => {
        console.error(err);
        return undefined;
    });

    const characters = rawCharacters?.map((item: any) => {
        return {
            ...item.expand.character,
            role: item.role,
        }
    });

    return (
        <>
            <main className="flex flex-col gap-6 items-start w-full pb-4">
                <div className="flex flex-row w-full gap-2 items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <BackButton />
                        <div className="flex flex-col gap-0">
                            <h1 className="text-4xl font-bold">{manga.title}</h1>
                            <p>
                                {manga.alternative_titles["japanese"] && (
                                    <span className="text-neutral-500 dark:text-neutral-400">
                                        {manga.alternative_titles["japanese"]}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-row gap-3 items-center">
                        <Button variant="ghost">
                            Edit
                        </Button>
                        <Button>
                            Add to list <Plus size={16} className="ml-2" />
                        </Button>
                    </div>
                </div>
                <div className="flex flex-row gap-8 items-start w-full h-full">
                    <div className="flex flex-col gap-4 items-start h-full w-1/5">
                        <AspectRatio ratio={2 / 3} className="w-full h-full rounded-md overflow-hidden">
                            <Image src={`${process.env.NEXT_PUBLIC_AUTH_URL}/api/files/manga/${manga.id}/${manga.cover}`} alt={manga.title + "cover"} width={200} height={400} className="w-full h-full rounded-md border border-black/10 dark:border-white/10" />
                        </AspectRatio>
                        {typeof manga.alternative_titles !== "undefined" && (
                            <div className="flex flex-col gap-2 items-start w-full">
                                <h2 className="text-lg font-medium">
                                    Alternative Titles
                                </h2>
                                <hr className="border-b w-full" />
                                <div className="list-disc list-inside">
                                    {Object.keys(manga.alternative_titles).map((key) => (
                                        <p className="flex flex-row gap-2">
                                            <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                                                {key[0].toUpperCase() + key.slice(1, key.length)}: {" "}
                                            </span>
                                            {manga.alternative_titles[key]}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 items-start w-full">
                            <h2 className="text-lg font-medium">
                                Information
                            </h2>
                            <hr className="border-b w-full" />
                            <div className="flex flex-col gap-2 items-start">
                                <p className="flex flex-row gap-2">
                                    <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                                        Status: {" "}
                                    </span>
                                    {manga.status[0].toUpperCase() + manga.status.slice(1, manga.status.length)}
                                </p>
                                <p className="flex flex-row gap-2">
                                    <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                                        Volumes: {" "}
                                    </span>
                                    {manga.volumes === 0 ? "Unknown" : manga.volumes}
                                </p>
                                <p className="flex flex-row gap-2">
                                    <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                                        Chapters: {" "}
                                    </span>
                                    {manga.chapters === 0 ? "Unknown" : manga.chapters}
                                </p>
                                <p className="flex flex-row gap-2">
                                    <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                                        Started: {" "}
                                    </span>
                                    {new Date(manga.start_date).toLocaleDateString()}
                                </p>
                                {manga.end_date.length > 1 && (
                                    <p className="flex flex-row gap-2">
                                        <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
                                            Ended: {" "}
                                        </span>
                                        {manga.end_date.length < 1 ? "?" : new Date(manga.end_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-4/5 grow flex-1 h-full flex flex-col items-center gap-6">
                        <div className="flex flex-col gap-2 items-start w-full">
                            <h2 className="text-lg font-medium">
                                Synopsis
                            </h2>
                            <hr className="border-b w-full" />
                            <div dangerouslySetInnerHTML={{ __html: sanitize(manga.synopsis) }} className="text-neutral-500 dark:text-neutral-400" />
                        </div>
                        {manga.background && (
                            <div className="flex flex-col gap-2 items-start w-full">
                                <h2 className="text-lg font-medium">
                                    Background
                                </h2>
                                <hr className="border-b w-full" />
                                <div dangerouslySetInnerHTML={{ __html: sanitize(manga.background) }} className="text-neutral-500 dark:text-neutral-400" />
                            </div>
                        )}
                        <div className="flex flex-col gap-2 items-start w-full">
                            <h2 className="text-lg font-medium">
                                Characters
                            </h2>
                            <hr className="border-b w-full" />
                            {typeof characters === "undefined" ? (
                                <div className="flex flex-col w-full h-full gap-3 justify-center items-center p-4   ">
                                    <div className="flex flex-row gap-2 items-center">
                                        <X size={24} className="text-neutral-500 dark:text-neutral-400" />
                                        <p className="text-neutral-500 dark:text-neutral-400">
                                            Failed to fetch characters.
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        Retry
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 gap-4 py-2">
                                        {characters.map((character: any) => (
                                            <div className="flex flex-col items-start w-full h-full">
                                                <Image src={`${process.env.NEXT_PUBLIC_AUTH_URL}/api/files/characters/${character.id}/${character.portrait}`} alt={character.name} width={800} height={900} className="w-full h-full object-cover rounded-md border border-black/10 dark:border-white/10" />
                                                <div className="relative w-full h-full">
                                                    <div className="absolute left-0 bottom-0 right-0 border-t bg-white/10 dark:bg-black/10 backdrop-blur-md border-black/10 dark:border-white/10 p-2 text-white rounded-md">
                                                        <h3 className="text-lg font-medium">
                                                            {character.name}
                                                        </h3>
                                                        <p className="text-neutral-700 dark:text-neutral-300">
                                                            {character.role[0].toUpperCase() + character.role.slice(1, character.role.length)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}