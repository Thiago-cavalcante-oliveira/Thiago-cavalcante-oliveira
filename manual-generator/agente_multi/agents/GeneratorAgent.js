"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var fs = require("fs/promises");
var path = require("path");
var GeneratorAgent = /** @class */ (function (_super) {
    __extends(GeneratorAgent, _super);
    function GeneratorAgent() {
        var _this = this;
        var config = {
            name: 'GeneratorAgent',
            version: '1.0.0',
            description: 'Agente especializado na geração de documentos finais em múltiplos formatos',
            capabilities: [
                { name: 'markdown_generation', description: 'Geração de documentos Markdown', version: '1.0.0' },
                { name: 'html_generation', description: 'Geração de documentos HTML', version: '1.0.0' },
                { name: 'pdf_generation', description: 'Geração de documentos PDF', version: '1.0.0' },
                { name: 'multi_format_export', description: 'Exportação em múltiplos formatos', version: '1.0.0' },
                { name: 'document_styling', description: 'Aplicação de estilos e formatação', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.currentDocuments = null;
        _this.minioService = new MinIOService_js_1.MinIOService();
        _this.outputDir = path.join(process.cwd(), 'output', 'final_documents');
        return _this;
    }
    GeneratorAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.ensureOutputDirectory()];
                    case 2:
                        _a.sent();
                        this.log('GeneratorAgent inicializado para geração de documentos');
                        return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.processTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        _a = task.type;
                        switch (_a) {
                            case 'generate_final_documents': return [3 /*break*/, 2];
                            case 'generate_specific_format': return [3 /*break*/, 4];
                            case 'update_documents': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.handleDocumentGeneration(task)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.handleSpecificFormatGeneration(task)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: return [4 /*yield*/, this.handleDocumentUpdate(task)];
                    case 7: return [2 /*return*/, _b.sent()];
                    case 8: throw new Error("Tipo de tarefa n\u00E3o suportada: ".concat(task.type));
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.handleDocumentGeneration = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, userContent, crawlAnalysis, sessionData, authContext, rawData, documents, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _a = task.data, userContent = _a.userContent, crawlAnalysis = _a.crawlAnalysis, sessionData = _a.sessionData, authContext = _a.authContext, rawData = _a.rawData;
                        this.log('Iniciando geração de documentos finais');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.generateAllFormats(userContent, crawlAnalysis)];
                    case 2:
                        documents = _b.sent();
                        this.currentDocuments = documents;
                        // Enviar notificação de conclusão para o Orchestrator
                        this.sendTask('OrchestratorAgent', 'generation_complete', {
                            documents: documents,
                            userContent: userContent,
                            crawlAnalysis: crawlAnalysis,
                            sessionData: sessionData,
                            authContext: authContext,
                            rawData: rawData
                        }, 'high');
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: documents,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 3:
                        error_2 = _b.sent();
                        this.log("Erro na gera\u00E7\u00E3o de documentos: ".concat(error_2), 'error');
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.handleSpecificFormatGeneration = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, userContent, format, options, startTime, result, _b, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = task.data, userContent = _a.userContent, format = _a.format, options = _a.options;
                        startTime = Date.now();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 10, , 11]);
                        result = void 0;
                        _b = format;
                        switch (_b) {
                            case 'markdown': return [3 /*break*/, 2];
                            case 'html': return [3 /*break*/, 4];
                            case 'pdf': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.generateMarkdown(userContent)];
                    case 3:
                        result = _c.sent();
                        return [3 /*break*/, 9];
                    case 4: return [4 /*yield*/, this.generateHTML(userContent)];
                    case 5:
                        result = _c.sent();
                        return [3 /*break*/, 9];
                    case 6: return [4 /*yield*/, this.generatePDF(userContent)];
                    case 7:
                        result = _c.sent();
                        return [3 /*break*/, 9];
                    case 8: throw new Error("Formato n\u00E3o suportado: ".concat(format));
                    case 9: return [2 /*return*/, {
                            id: task.id,
                            taskId: task.id,
                            success: true,
                            data: result,
                            timestamp: new Date(),
                            processingTime: Date.now() - startTime
                        }];
                    case 10:
                        error_3 = _c.sent();
                        throw error_3;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.handleDocumentUpdate = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, updates, format, startTime, updated, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, updates = _a.updates, format = _a.format;
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.updateDocuments(updates, format)];
                    case 2:
                        updated = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: updated,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 3:
                        error_4 = _b.sent();
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.generateAllFormats = function (userContent, crawlAnalysis) {
        return __awaiter(this, void 0, void 0, function () {
            var markdownContent, markdownPath, htmlContent, htmlPath, pdfPath, pdfContent, error_5, markdownUrl, htmlUrl, pdfUrl, _a, wordCount, sectionCount, documents;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.log('Gerando documentos em todos os formatos (MD, HTML, PDF)');
                        return [4 /*yield*/, this.generateMarkdown(userContent)];
                    case 1:
                        markdownContent = _c.sent();
                        markdownPath = path.join(this.outputDir, "manual_usuario_".concat(Date.now(), ".md"));
                        return [4 /*yield*/, fs.writeFile(markdownPath, markdownContent, 'utf-8')];
                    case 2:
                        _c.sent();
                        return [4 /*yield*/, this.generateHTML(userContent)];
                    case 3:
                        htmlContent = _c.sent();
                        htmlPath = path.join(this.outputDir, "manual_usuario_".concat(Date.now(), ".html"));
                        return [4 /*yield*/, fs.writeFile(htmlPath, htmlContent, 'utf-8')];
                    case 4:
                        _c.sent();
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 8, , 9]);
                        return [4 /*yield*/, this.generatePDF(userContent)];
                    case 6:
                        pdfContent = _c.sent();
                        pdfPath = path.join(this.outputDir, "manual_usuario_".concat(Date.now(), ".pdf"));
                        return [4 /*yield*/, fs.writeFile(pdfPath, pdfContent, 'binary')];
                    case 7:
                        _c.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        error_5 = _c.sent();
                        this.log("PDF n\u00E3o p\u00F4de ser gerado: ".concat(error_5), 'warn');
                        return [3 /*break*/, 9];
                    case 9: return [4 /*yield*/, this.minioService.uploadFile(markdownPath, path.basename(markdownPath), 'text/markdown')];
                    case 10:
                        markdownUrl = _c.sent();
                        return [4 /*yield*/, this.minioService.uploadFile(htmlPath, path.basename(htmlPath), 'text/html')];
                    case 11:
                        htmlUrl = _c.sent();
                        if (!pdfPath) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.minioService.uploadFile(pdfPath, path.basename(pdfPath), 'application/pdf')];
                    case 12:
                        _a = _c.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        _a = undefined;
                        _c.label = 14;
                    case 14:
                        pdfUrl = _a;
                        wordCount = this.calculateWordCount(markdownContent);
                        sectionCount = ((_b = userContent.sections) === null || _b === void 0 ? void 0 : _b.length) || 0;
                        documents = {
                            formats: {
                                markdown: markdownContent,
                                html: htmlContent,
                                pdf: pdfContent
                            },
                            filePaths: {
                                markdown: markdownPath,
                                html: htmlPath,
                                pdf: pdfPath
                            },
                            minioUrls: {
                                markdown: markdownUrl || markdownPath,
                                html: htmlUrl || htmlPath,
                                pdf: pdfUrl || pdfPath
                            },
                            metadata: {
                                generatedAt: new Date(),
                                totalPages: crawlAnalysis.totalPages || 1,
                                wordCount: wordCount,
                                sectionCount: sectionCount
                            }
                        };
                        this.log("Documentos gerados: MD (".concat(wordCount, " palavras), HTML, ").concat(pdfPath ? 'PDF' : 'PDF falhou'));
                        return [2 /*return*/, documents];
                }
            });
        });
    };
    GeneratorAgent.prototype.generateMarkdown = function (userContent) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata, introduction, sections, appendices, summary, markdown, categories;
            return __generator(this, function (_a) {
                metadata = userContent.metadata;
                introduction = userContent.introduction;
                sections = userContent.sections || [];
                appendices = userContent.appendices;
                summary = userContent.summary;
                markdown = "# ".concat(metadata.title, "\n\n").concat(metadata.subtitle, "\n\n---\n\n**Vers\u00E3o:** ").concat(metadata.version, "  \n**Data de Cria\u00E7\u00E3o:** ").concat(metadata.dateCreated, "  \n**P\u00FAblico-Alvo:** ").concat(metadata.targetAudience, "  \n**Tempo de Leitura Estimado:** ").concat(metadata.estimatedReadTime, "\n\n---\n\n## \uD83D\uDCCB \u00CDndice\n\n");
                // Gerar índice
                sections.forEach(function (section, index) {
                    markdown += "".concat(index + 1, ". [").concat(section.title, "](#").concat(section.id, ")\n");
                });
                markdown += "\n".concat(sections.length + 1, ". [Troubleshooting](#troubleshooting)\n").concat(sections.length + 2, ". [Gloss\u00E1rio](#glossario)\n").concat(sections.length + 3, ". [Perguntas Frequentes](#faqs)\n").concat(sections.length + 4, ". [Resumo e Pr\u00F3ximos Passos](#resumo)\n\n---\n\n## \uD83C\uDFAF Introdu\u00E7\u00E3o\n\n### Vis\u00E3o Geral\n\n").concat(introduction.overview, "\n\n### Requisitos Necess\u00E1rios\n\n");
                introduction.requirements.forEach(function (req) {
                    markdown += "- ".concat(req, "\n");
                });
                markdown += "\n### Como Usar Este Manual\n\n".concat(introduction.howToUseManual, "\n\n---\n\n");
                // Gerar seções principais
                sections.forEach(function (section, index) {
                    markdown += "## ".concat(index + 1, ". ").concat(section.title, " {#").concat(section.id, "}\n\n").concat(section.description, "\n\n### \uD83D\uDCDD Passo a Passo\n\n");
                    section.steps.forEach(function (step) {
                        markdown += "#### ".concat(step.stepNumber, ". ").concat(step.action, "\n\n").concat(step.description, "\n\n**Resultado Esperado:** ").concat(step.expectedResult, "\n\n");
                        if (step.screenshot) {
                            markdown += "![Screenshot do Passo ".concat(step.stepNumber, "](").concat(step.screenshot, ")\n\n");
                        }
                        if (step.notes && step.notes.length > 0) {
                            markdown += "**Observa\u00E7\u00F5es:**\n";
                            step.notes.forEach(function (note) {
                                markdown += "- ".concat(note, "\n");
                            });
                            markdown += '\n';
                        }
                    });
                    if (section.tips && section.tips.length > 0) {
                        markdown += "### \uD83D\uDCA1 Dicas \u00DAteis\n\n";
                        section.tips.forEach(function (tip) {
                            markdown += "- ".concat(tip, "\n");
                        });
                        markdown += '\n';
                    }
                    if (section.troubleshooting && section.troubleshooting.length > 0) {
                        markdown += "### \u26A0\uFE0F Problemas Comuns\n\n";
                        section.troubleshooting.forEach(function (issue) {
                            markdown += "- ".concat(issue, "\n");
                        });
                        markdown += '\n';
                    }
                    markdown += '---\n\n';
                });
                // Gerar apêndices
                markdown += "## \uD83D\uDD27 Troubleshooting {#troubleshooting}\n\nEsta se\u00E7\u00E3o cont\u00E9m solu\u00E7\u00F5es para os problemas mais comuns:\n\n";
                appendices.troubleshooting.forEach(function (item) {
                    markdown += "### ".concat(item.problem, "\n\n**Sintomas:**\n");
                    item.symptoms.forEach(function (symptom) {
                        markdown += "- ".concat(symptom, "\n");
                    });
                    markdown += "\n**Solu\u00E7\u00F5es:**\n";
                    item.solutions.forEach(function (solution) {
                        markdown += "- ".concat(solution, "\n");
                    });
                    markdown += "\n**Preven\u00E7\u00E3o:**\n";
                    item.prevention.forEach(function (prev) {
                        markdown += "- ".concat(prev, "\n");
                    });
                    markdown += '\n---\n\n';
                });
                markdown += "## \uD83D\uDCD6 Gloss\u00E1rio {#glossario}\n\n";
                appendices.glossary.forEach(function (item) {
                    markdown += "**".concat(item.term, ":** ").concat(item.definition);
                    if (item.example) {
                        markdown += " *Exemplo: ".concat(item.example, "*");
                    }
                    markdown += '\n\n';
                });
                markdown += "## \u2753 Perguntas Frequentes {#faqs}\n\n";
                categories = Array.from(new Set(appendices.faqs.map(function (faq) { return faq.category; })));
                categories.forEach(function (category) {
                    markdown += "### ".concat(category, "\n\n");
                    appendices.faqs
                        .filter(function (faq) { return faq.category === category; })
                        .forEach(function (faq) {
                        markdown += "**P: ".concat(faq.question, "**\n\nR: ").concat(faq.answer, "\n\n");
                    });
                });
                markdown += "## \uD83D\uDCCB Resumo e Pr\u00F3ximos Passos {#resumo}\n\n### Principais Aprendizados\n\n";
                summary.keyTakeaways.forEach(function (takeaway) {
                    markdown += "- ".concat(takeaway, "\n");
                });
                markdown += "\n### Pr\u00F3ximos Passos\n\n";
                summary.nextSteps.forEach(function (step) {
                    markdown += "- ".concat(step, "\n");
                });
                markdown += "\n### Contatos de Suporte\n\n";
                summary.supportContacts.forEach(function (contact) {
                    markdown += "- ".concat(contact, "\n");
                });
                markdown += "\n---\n\n*Manual gerado automaticamente em ".concat(new Date().toLocaleString('pt-BR'), " pelo Sistema de Gera\u00E7\u00E3o de Manuais.*\n");
                return [2 /*return*/, markdown];
            });
        });
    };
    GeneratorAgent.prototype.generateHTML = function (userContent) {
        return __awaiter(this, void 0, void 0, function () {
            var markdownContent, htmlTemplate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateMarkdown(userContent)];
                    case 1:
                        markdownContent = _a.sent();
                        htmlTemplate = "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>".concat(userContent.metadata.title, "</title>\n    <style>\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n            line-height: 1.6;\n            color: #333;\n            max-width: 1200px;\n            margin: 0 auto;\n            padding: 20px;\n            background-color: #f9f9f9;\n        }\n        .container {\n            background: white;\n            padding: 40px;\n            border-radius: 8px;\n            box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n        }\n        h1 {\n            color: #2c3e50;\n            border-bottom: 3px solid #3498db;\n            padding-bottom: 10px;\n        }\n        h2 {\n            color: #34495e;\n            margin-top: 30px;\n            padding-left: 15px;\n            border-left: 4px solid #3498db;\n        }\n        h3 {\n            color: #7f8c8d;\n            margin-top: 25px;\n        }\n        h4 {\n            color: #95a5a6;\n            margin-top: 20px;\n        }\n        .metadata {\n            background: #ecf0f1;\n            padding: 20px;\n            border-radius: 5px;\n            margin: 20px 0;\n        }\n        .toc {\n            background: #f8f9fa;\n            padding: 20px;\n            border-radius: 5px;\n            margin: 20px 0;\n        }\n        .toc ul {\n            list-style-type: none;\n            padding-left: 0;\n        }\n        .toc li {\n            margin: 8px 0;\n        }\n        .toc a {\n            color: #3498db;\n            text-decoration: none;\n        }\n        .toc a:hover {\n            text-decoration: underline;\n        }\n        .step {\n            background: #f1f2f6;\n            padding: 15px;\n            margin: 15px 0;\n            border-radius: 5px;\n            border-left: 4px solid #2ecc71;\n        }\n        .tip {\n            background: #fff3cd;\n            border: 1px solid #ffeaa7;\n            padding: 15px;\n            border-radius: 5px;\n            margin: 10px 0;\n        }\n        .warning {\n            background: #f8d7da;\n            border: 1px solid #f5c6cb;\n            padding: 15px;\n            border-radius: 5px;\n            margin: 10px 0;\n        }\n        .troubleshooting {\n            background: #e1f5fe;\n            border: 1px solid #b3e5fc;\n            padding: 15px;\n            border-radius: 5px;\n            margin: 10px 0;\n        }\n        code {\n            background: #f4f4f4;\n            padding: 2px 5px;\n            border-radius: 3px;\n            font-family: 'Courier New', monospace;\n        }\n        blockquote {\n            border-left: 4px solid #bdc3c7;\n            margin: 0;\n            padding: 10px 20px;\n            background: #f9f9f9;\n        }\n        img {\n            max-width: 100%;\n            height: auto;\n            border-radius: 5px;\n            box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n            margin: 10px 0;\n        }\n        .footer {\n            margin-top: 50px;\n            padding-top: 20px;\n            border-top: 1px solid #ecf0f1;\n            text-align: center;\n            color: #7f8c8d;\n            font-size: 0.9em;\n        }\n        .emoji {\n            font-size: 1.2em;\n        }\n        ul, ol {\n            padding-left: 20px;\n        }\n        li {\n            margin: 5px 0;\n        }\n        @media (max-width: 768px) {\n            body {\n                padding: 10px;\n            }\n            .container {\n                padding: 20px;\n            }\n            h1 {\n                font-size: 1.8em;\n            }\n            h2 {\n                font-size: 1.4em;\n            }\n        }\n        @media print {\n            body {\n                background: white;\n            }\n            .container {\n                box-shadow: none;\n            }\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        ").concat(this.convertMarkdownToHTML(markdownContent), "\n    </div>\n</body>\n</html>");
                        return [2 /*return*/, htmlTemplate];
                }
            });
        });
    };
    GeneratorAgent.prototype.convertMarkdownToHTML = function (markdown) {
        // Conversão básica de Markdown para HTML
        var html = markdown;
        // Headers
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        // Bold
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
        // Italic
        html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>');
        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1">');
        // Code
        html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
        // Lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        // Line breaks
        html = html.replace(/\n\n/gim, '</p><p>');
        html = html.replace(/\n/gim, '<br>');
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/gim, '');
        html = html.replace(/<p><h([1-6])>/gim, '<h$1>');
        html = html.replace(/<\/h([1-6])><\/p>/gim, '</h$1>');
        // Fix lists
        html = html.replace(/<p><li>/gim, '<ul><li>');
        html = html.replace(/<\/li><\/p>/gim, '</li></ul>');
        return html;
    };
    GeneratorAgent.prototype.generatePDF = function (userContent) {
        return __awaiter(this, void 0, void 0, function () {
            var htmlContent, puppeteer, browser, page, pdfBuffer, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, this.generateHTML(userContent)];
                    case 1:
                        htmlContent = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('puppeteer'); }).catch(function () { return null; })];
                    case 2:
                        puppeteer = _a.sent();
                        if (!puppeteer) return [3 /*break*/, 8];
                        return [4 /*yield*/, puppeteer.launch()];
                    case 3:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 4:
                        page = _a.sent();
                        return [4 /*yield*/, page.setContent(htmlContent)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, page.pdf({
                                format: 'A4',
                                printBackground: true,
                                margin: {
                                    top: '1cm',
                                    right: '1cm',
                                    bottom: '1cm',
                                    left: '1cm'
                                }
                            })];
                    case 6:
                        pdfBuffer = _a.sent();
                        return [4 /*yield*/, browser.close()];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, Buffer.from(pdfBuffer).toString('base64')];
                    case 8: throw new Error('Puppeteer não disponível para geração de PDF');
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_6 = _a.sent();
                        this.log("PDF n\u00E3o p\u00F4de ser gerado: ".concat(error_6), 'warn');
                        throw error_6;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.updateDocuments = function (updates, format) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementação futura para atualização de documentos
                this.log('Funcionalidade de atualização de documentos não implementada ainda');
                return [2 /*return*/, null];
            });
        });
    };
    GeneratorAgent.prototype.calculateWordCount = function (text) {
        return text.split(/\s+/).filter(function (word) { return word.length > 0; }).length;
    };
    GeneratorAgent.prototype.ensureOutputDirectory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.mkdir(this.outputDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        this.log("Erro ao criar diret\u00F3rio de sa\u00EDda: ".concat(error_7), 'warn');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GeneratorAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, report, documents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        report = "# Relat\u00F3rio do GeneratorAgent\n\n**Task ID:** ".concat(taskResult.taskId, "\n**Timestamp:** ").concat(timestamp, "\n**Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Falha', "\n**Tempo de Processamento:** ").concat(taskResult.processingTime, "ms\n\n");
                        if (taskResult.success && taskResult.data) {
                            documents = taskResult.data;
                            report += "## \uD83D\uDCC4 Documentos Gerados\n\n### Formatos Dispon\u00EDveis\n\n- **Markdown:** \u2705 Gerado (".concat(documents.metadata.wordCount, " palavras)\n- **HTML:** \u2705 Gerado com estilos responsivos\n- **PDF:** ").concat(documents.formats.pdf ? '✅ Gerado' : '❌ Falhou', "\n\n### Metadados dos Documentos\n\n- **Data de Gera\u00E7\u00E3o:** ").concat(documents.metadata.generatedAt.toLocaleString('pt-BR'), "\n- **Total de P\u00E1ginas Analisadas:** ").concat(documents.metadata.totalPages, "\n- **Contagem de Palavras:** ").concat(documents.metadata.wordCount, "\n- **Se\u00E7\u00F5es no Manual:** ").concat(documents.metadata.sectionCount, "\n\n### Caminhos dos Arquivos\n\n**Local:**\n- Markdown: `").concat(documents.filePaths.markdown, "`\n- HTML: `").concat(documents.filePaths.html, "`\n").concat(documents.filePaths.pdf ? "- PDF: `".concat(documents.filePaths.pdf, "`") : '', "\n\n**MinIO (Cloud):**\n- Markdown: ").concat(documents.minioUrls.markdown, "\n- HTML: ").concat(documents.minioUrls.html, "\n").concat(documents.minioUrls.pdf ? "- PDF: ".concat(documents.minioUrls.pdf) : '', "\n\n### Recursos dos Documentos\n\n**Markdown:**\n- Formata\u00E7\u00E3o rica com emojis\n- \u00CDndice interativo\n- Se\u00E7\u00F5es bem estruturadas\n- Links internos funcionais\n\n**HTML:**\n- Design responsivo\n- Estilos CSS modernos\n- Compat\u00EDvel com impress\u00E3o\n- Navega\u00E7\u00E3o suave\n\n").concat(documents.formats.pdf ? '**PDF:**\n- Layout profissional\n- Pronto para impressão\n- Formatação preservada' : '**PDF:** Não foi possível gerar (puppeteer não disponível)', "\n\n## \uD83C\uDFAF Resultado Final\n\n\u2705 Sistema de gera\u00E7\u00E3o multi-agente **CONCLU\u00CDDO COM SUCESSO**\n\n### Pipeline Executado:\n1. **LoginAgent** \u2192 Autentica\u00E7\u00E3o e captura de sess\u00E3o\n2. **CrawlerAgent** \u2192 Navega\u00E7\u00E3o e captura de elementos\n3. **AnalysisAgent** \u2192 An\u00E1lise inteligente com IA\n4. **ContentAgent** \u2192 Cria\u00E7\u00E3o de conte\u00FAdo user-friendly  \n5. **GeneratorAgent** \u2192 Gera\u00E7\u00E3o de documentos finais\n\n### Estat\u00EDsticas Finais:\n- **Agentes Utilizados:** 5\n- **Formatos Gerados:** ").concat(documents.formats.pdf ? '3' : '2', " (MD, HTML").concat(documents.formats.pdf ? ', PDF' : '', ")\n- **Armazenamento:** Local + MinIO Cloud\n- **Status:** Pronto para uso\n\n## Pr\u00F3ximas Etapas\n\n\u2705 **PROCESSO COMPLETO** - Documentos prontos para entrega\n\uD83D\uDCE5 Downloads dispon\u00EDveis nos links do MinIO\n\uD83D\uDD04 Sistema pronto para nova execu\u00E7\u00E3o\n\uD83D\uDCDE Suporte dispon\u00EDvel para melhorias\n\n");
                        }
                        else {
                            report += "## \u274C Erro na Gera\u00E7\u00E3o de Documentos\n\n**Erro:** ".concat(taskResult.error, "\n\n## A\u00E7\u00F5es Recomendadas\n\n- Verificar disponibilidade de espa\u00E7o em disco\n- Verificar permiss\u00F5es de escrita no diret\u00F3rio output/\n- Verificar configura\u00E7\u00E3o do MinIO\n- Instalar puppeteer para gera\u00E7\u00E3o de PDF: `npm install puppeteer`\n\n");
                        }
                        // Salvar relatório no MinIO
                        return [4 /*yield*/, this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId)];
                    case 1:
                        // Salvar relatório no MinIO
                        _a.sent();
                        return [2 /*return*/, report];
                }
            });
        });
    };
    GeneratorAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.currentDocuments = null;
                this.log('GeneratorAgent finalizado - documentos gerados com sucesso');
                return [2 /*return*/];
            });
        });
    };
    return GeneratorAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.GeneratorAgent = GeneratorAgent;
