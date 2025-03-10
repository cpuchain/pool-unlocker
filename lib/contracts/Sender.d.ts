import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from "ethers";
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "./common";
export interface SenderInterface extends Interface {
    getFunction(nameOrSignature: "send"): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: "Sent"): EventFragment;
    encodeFunctionData(functionFragment: "send", values: [AddressLike[], BigNumberish[], BigNumberish]): string;
    decodeFunctionResult(functionFragment: "send", data: BytesLike): Result;
}
export declare namespace SentEvent {
    type InputTuple = [
        to: AddressLike,
        value: BigNumberish,
        success: boolean
    ];
    type OutputTuple = [to: string, value: bigint, success: boolean];
    interface OutputObject {
        to: string;
        value: bigint;
        success: boolean;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface Sender extends BaseContract {
    connect(runner?: ContractRunner | null): Sender;
    waitForDeployment(): Promise<this>;
    interface: SenderInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    send: TypedContractMethod<[
        addresses: AddressLike[],
        amounts: BigNumberish[],
        gasLimit: BigNumberish
    ], [
        void
    ], "payable">;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: "send"): TypedContractMethod<[
        addresses: AddressLike[],
        amounts: BigNumberish[],
        gasLimit: BigNumberish
    ], [
        void
    ], "payable">;
    getEvent(key: "Sent"): TypedContractEvent<SentEvent.InputTuple, SentEvent.OutputTuple, SentEvent.OutputObject>;
    filters: {
        "Sent(address,uint256,bool)": TypedContractEvent<SentEvent.InputTuple, SentEvent.OutputTuple, SentEvent.OutputObject>;
        Sent: TypedContractEvent<SentEvent.InputTuple, SentEvent.OutputTuple, SentEvent.OutputObject>;
    };
}
