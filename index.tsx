/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { HeadingTertiary } from "@components/Heading";
import { DeleteIcon } from "@components/Icons";
import { Devs, EquicordDevs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { Button, React, Select, TextInput, UserStore, useState } from "@webpack/common";

type Rule = Record<"find" | "replace" | "onlyIfIncludes" | "exceptIfIncludes" | "scope", string>;

interface TextReplaceProps {
    title: string;
    rulesArray: Rule[];
}

const makeEmptyRule: () => Rule = () => ({
    find: "",
    replace: "",
    onlyIfIncludes: "",
    exceptIfIncludes: "",
    scope: "myMessages"
});
const makeEmptyRuleArray = () => [makeEmptyRule()];

const settings = definePluginSettings({
    replace: {
        type: OptionType.COMPONENT,
        component: () => {
            const { stringRules, regexRules } = settings.use(["stringRules", "regexRules"]);

            return (
                <>
                    <TextReplace
                        title="Using String"
                        rulesArray={stringRules}
                    />
                    <TextReplace
                        title="Using Regex"
                        rulesArray={regexRules}
                    />
                    <TextReplaceTesting />
                </>
            );
        }
    },
    stringRules: {
        type: OptionType.CUSTOM,
        default: makeEmptyRuleArray(),
        description: "Rules for replacing text using string matching."
    },
    regexRules: {
        type: OptionType.CUSTOM,
        default: makeEmptyRuleArray(),
        description: "Rules for replacing text using regular expressions."
    }
});

function stringToRegex(str: string) {
    const match = str.match(/^(\/)?(.+?)(?:\/([gimsuyv]*))?$/); // Regex to match regex
    return match
        ? new RegExp(
            match[2], // Pattern
            match[3]
                ?.split("") // Remove duplicate flags
                .filter((char, pos, flagArr) => flagArr.indexOf(char) === pos)
                .join("")
            ?? "g"
        )
        : new RegExp(str); // Not a regex, return string
}

function renderFindError(regexStr: string) {
    try {
        stringToRegex(regexStr);
        return null;
    } catch (e) {
        return (
            <span style={{ color: "var(--text-danger)" }}>
                {String(e)}
            </span>
        );
    }
}

function Input({ initialValue, onChange, placeholder }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            spellCheck={false}
            onBlur={() => value !== initialValue && onChange(value)}
        />
    );
}

function TextReplace({ title, rulesArray }: TextReplaceProps) {
    const isRegexRules = title === "Using Regex";

    async function onClickRemove(index: number) {
        if (index === rulesArray.length - 1) return;
        rulesArray.splice(index, 1);
    }

    async function onChange(e: string, index: number, key: string) {
        if (index === rulesArray.length - 1) {
            rulesArray.push(makeEmptyRule());
        }

        rulesArray[index][key] = e;

        if (rulesArray[index].find === "" && rulesArray[index].replace === "" && rulesArray[index].onlyIfIncludes === "" && rulesArray[index].exceptIfIncludes === "" && index !== rulesArray.length - 1) {
            rulesArray.splice(index, 1);
        }
    }

    const scopeOptions = [
        { label: "Apply to your outbound messages (visible to everyone)", value: "myMessages" },
        { label: "Apply to all existing messages (only visible to you)", value: "othersMessages" },
        { label: "Apply to all messages", value: "allMessages" }
    ];

    return (
        <>
            <HeadingTertiary>{title}</HeadingTertiary>
            <Flex flexDirection="column" style={{ gap: "0.5em", paddingBottom: "1.25em" }}>
                {
                    rulesArray.map((rule, index) =>
                        <React.Fragment key={`${rule.find}-${index}`}>
                            <Flex flexDirection="row" style={{ flexGrow: 1, gap: "0.5em" }}>
                                <Input
                                    placeholder="Find"
                                    initialValue={rule.find}
                                    onChange={e => onChange(e, index, "find")}
                                />
                                <Input
                                    placeholder="Replace"
                                    initialValue={rule.replace}
                                    onChange={e => onChange(e, index, "replace")}
                                />
                                <Input
                                    placeholder="Only if includes"
                                    initialValue={rule.onlyIfIncludes}
                                    onChange={e => onChange(e, index, "onlyIfIncludes")}
                                />
                                <Input
                                    placeholder="Except if includes"
                                    initialValue={rule.exceptIfIncludes}
                                    onChange={e => onChange(e, index, "exceptIfIncludes")}
                                />
                            </Flex>
                            {(index !== rulesArray.length - 1) && <Flex flexDirection="row" style={{ gap: "0.5em" }}>
                                <div style={{ flex: 0.9 }}>
                                    <Select
                                        options={scopeOptions}
                                        isSelected={e => e === rule.scope}
                                        select={e => onChange(e, index, "scope")}
                                        serialize={e => e}
                                    />
                                </div>
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => onClickRemove(index)}
                                    style={{ flex: 0.10, backgroundColor: "var(--input-background)", border: "1px solid var(--input-border)", color: "var(--status-danger)" }}
                                >
                                    <DeleteIcon style={{ verticalAlign: "middle" }} />
                                </Button>
                            </Flex>}
                            {(index !== rulesArray.length - 1) && <Divider style={{ width: "unset", margin: "0.5em 0" }}></Divider>}
                            {isRegexRules && (
                                <>
                                    {renderFindError(rule.find)}
                                    {renderFindError(rule.onlyIfIncludes)}
                                    {renderFindError(rule.exceptIfIncludes)}
                                </>
                            )}
                        </React.Fragment>
                    )
                }
            </Flex>
        </>
    );
}

function TextReplaceTesting() {
    const [value, setValue] = useState("");
    return (
        <>
            <HeadingTertiary>Test Rules</HeadingTertiary>
            <TextInput placeholder="Type a message" onChange={setValue} />
            <TextInput placeholder="Message with rules applied" editable={false} value={applyRules(value, "allMessages")} />
        </>
    );
}

function testRegex(content: string, regexStr: string): Boolean | null {
    try {
        const regex = stringToRegex(regexStr);
        return regex.test(content);
    } catch (e) {
        new Logger("TextReplaceEnhanced").error(`Invalid regex: ${regexStr}`);
        return null;
    }
}

function applyRules(content: string, scope: "myMessages" | "othersMessages" | "allMessages"): string {
    if (content.length === 0) {
        return content;
    }

    for (const rule of settings.store.stringRules) {
        if (!rule.find) continue;
        if (rule.onlyIfIncludes && !content.includes(rule.onlyIfIncludes)) continue;
        if (rule.exceptIfIncludes && content.includes(rule.exceptIfIncludes)) continue;
        if (rule.scope !== "allMessages" && rule.scope !== scope && scope !== "allMessages") continue;

        content = ` ${content} `.replaceAll(rule.find, rule.replace.replaceAll("\\n", "\n")).replace(/^\s|\s$/g, "");
    }

    for (const rule of settings.store.regexRules) {
        if (!rule.find) continue;
        if (rule.scope !== "allMessages" && rule.scope !== scope && scope !== "allMessages") continue;
        
        if (rule.onlyIfIncludes) {
            const match = testRegex(content, rule.onlyIfIncludes);
            if (!match) continue;
        }

        if (rule.exceptIfIncludes) {
            const match = testRegex(content, rule.exceptIfIncludes);
            if (match || match === null) continue;
        }

        try {
            const regex = stringToRegex(rule.find);
            content = content.replace(regex, rule.replace.replaceAll("\\n", "\n"));
        } catch (e) {
            new Logger("TextReplaceEnhanced").error(`Invalid regex: ${rule.find}`);
        }
    }

    content = content.trim();
    return content;
}

function modifyIncomingMessage(message: Message) {
    const currentUser = UserStore.getCurrentUser();
    const messageAuthor = message.author;

    if (!message.content || !currentUser?.id || !messageAuthor?.id) {
        return message.content;
    }

    return applyRules(message.content, "othersMessages");
}

const TEXT_REPLACE_RULES_EXEMPT_CHANNEL_IDS = [
    "1102784112584040479", // Vencord's Text Replace Rules Channel
    "1419347113745059961", // Equicord's Requests Channel
];

export default definePlugin({
    name: "TextReplaceEnhanced",
    description: "Replace text in outgoing, or existing messages with additional options.",
    authors: [Devs.AutumnVN, Devs.TheKodeToad, EquicordDevs.Etorix, {
                name: "rels",
                id: 1067830761916477530n,
            },],

    settings,
    modifyIncomingMessage,

    patches: [
        {
            find: "!1,hideSimpleEmbedContent",
            replacement: {
                match: /(let{toAST:.{0,125}?)\(null!=\i\?\i:\i\).content/,
                replace: "const textReplaceContent=$self.modifyIncomingMessage(arguments[2]?.contentMessage??arguments[1]);$1textReplaceContent"
            }
        },
    ],

    start() {
        const { stringRules, regexRules } = settings.store;
        stringRules.forEach(rule => { if (!rule.scope) rule.scope = "myMessages"; });
        regexRules.forEach(rule => { if (!rule.scope) rule.scope = "myMessages"; });
    },

    onBeforeMessageSend(channelId, msg) {
        // Replacing text in channels used for sharing/requesting rules may be messy.
        if (TEXT_REPLACE_RULES_EXEMPT_CHANNEL_IDS.includes(channelId)) return;
        msg.content = applyRules(msg.content, "myMessages");
    }
});
